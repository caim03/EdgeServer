/**
 * Created by simone on 25/10/17.
 */

var masterTable = require('../../model/masterTableDb');
var chunkServer = require('../../model/chunkServer');
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');
var masterController = require('./masterController');
var ip = require("ip");
var config = require('../../config/config');
var request = require('request');




exports.newMasterRebalancment = newMasterRebalancmentFn;
exports.crushedSlaveRebalancment = crushedSlaveRebalancmentFn;
exports.addChunkGuidInTable = addChunkGuidInTableFn;


/**
 *  Hey sono un nuovo master!
 *  1) Scrivo a tutti nella rete, e gli chiedo tutti i metadati dei chunk in loro possesso
 *  2) Aggiorno mano mano la tabella master
 *  3) Infine distribuisco i miei chunks a chi ha il carico minore
 *
 *  TODO NB LOCKARE STO PROCESSO + BUFFERIZZARE (Load Balancer?) le richieste fino a ribilanciamento completato
 */
function newMasterRebalancmentFn()
{
    // console.log("STARTING REBALANCMENT");
    masterTable.cleanTable();
    chunkServer.getChunk().forEach(function (server) {
        if(server.ip !== ip.address()) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/metadata',
                method: 'GET'
            };

            var res = syncRequest('GET', obj.url);

            var receivedChunks = JSON.parse(res.getBody('utf8'));
            receivedChunks.forEach(function (chunk) {
                masterTable.addChunkRef(chunk.guid, server.ip);
            })
        }
    })
    //Per ogni elemento nella mia chunklist:
    //Creo la tabella di disponibilità ordinata della master table
    //Invio il chunk al primo della tabella che non abbia gia quel chunk
    var sended = false;
    var slaveServers = masterController.buildSlaveList(); //TODO Tabella fissata prima del ribilanciamento - si potrebbe aggiornarla mano mano ad ogni invio, ma ovviamente operazione + costosa
    chunkList.getChunkList().forEach(function (chunk) {
        sended = false;
        var guid = chunk.guid;
        slaveServers.forEach(function (server) {
            if(!sended)
                if(!masterTable.checkGuid(server,guid)) {
                    console.log("SPEDISCO " + guid + " A " + server);
                    var obj = {
                        url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                        method: 'POST',
                        json: {
                            type: "CHUNK",
                            guid: guid,
                            ipServer: server
                        }
                    };
                    request(obj, function (err, res) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                    })
                    addChunkGuidInTableFn(server, guid);
                    //TODO Invio fisico del chunk!
                    sended = true;
                }
        })
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + guid);
    })
    chunkList.cleanList();
    // console.log("REBALANCMENT COMPLETED");

}

/**
 *  Dopo che uno slave crasha
 *
 *  1) Cerca tutti i chunk relativi a quello slave nella tabella
 *  2) Ribilancia quei chunk ad altri slave
 *  3) Aggiorna la tabella
 */
function crushedSlaveRebalancmentFn(slave)
{
    //Per ogni elemento nella chunklist di quello slave:
    //Creo la tabella di disponibilità ordinata della master table
    //Invio il chunk al primo della tabella che non abbia gia quel chunk


    var chunkGuids = masterTable.getAllChunksBySlave(slave.ip);

    masterTable.removeFromOccupationTable(slave.ip, chunkGuids);
    var slaveServers = masterController.buildSlaveList();//TODO Tabella fissata prima del ribilanciamento - si potrebbe aggiornarla mano mano ad ogni invio, ma ovviamente operazione + costosa
    var sended = false;
    chunkGuids.forEach(function (chunks) {
        sended = false;
        var chunkguid = chunks.chunkguid;
        if(slaveServers.length!=0)
            slaveServers.forEach(function (server) {
                if (!sended)
                    if (!masterTable.checkGuid(server, chunkguid)) {
                        console.log("SPEDISCO " + chunkguid + " A " + server);
                        var obj = {
                            url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                            method: 'POST',
                            json: {
                                type: "CHUNK",
                                guid: chunkguid,
                                ipServer: server
                            }
                        };
                        request(obj, function (err, res) {
                            if (err) {
                                // console.log(err);
                                return;
                            }
                        });
                        addChunkGuidInTableFn(server, chunkguid);
                        //TODO X DEBORA Invio fisico del chunk! 2 OPZIONI: 1)Master manda (ip nuovo slave,guid) al vecchio slave che a sua volta invierà il file
                        //Mi serve: path del file nello slave, ip del server a cui inviare il file e il guid del file e id del client che ha accesso al file.

                        sended = true;
                    }

            });
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + chunkguid);
    })


}

//Aggiunge in tabella il chank guid e l'ip dello slave che lo possiede.
function addChunkGuidInTableFn(slaveIp, chankGuid)
{
    masterTable.addChunkRef(chankGuid, slaveIp);    //add idClient
    masterTable.printTable();
}