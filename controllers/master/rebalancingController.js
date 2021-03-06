/**
 * Created by simone on 25/10/17.
 */

var masterTable = require('../../model/masterTableDb');
var chunkServer = require('../../model/chunkServer');
var chunkList = require('../../model/chunkList');
var slaveTable = require('../../model/slave/slaveTable');
var syncRequest = require('sync-request');
var masterController = require('./masterController');
var ip = require("../../model/ip");
var config = require('../../config/config');
var request = require('request');
var fs=require('fs');


exports.newMasterRebalancment = newMasterRebalancmentFn;
exports.crushedSlaveRebalancment = crushedSlaveRebalancmentFn;
exports.addChunkGuidInTable = addChunkGuidInTableFn;


/**
 *  Questa funzione viene richiamata dal generico server dopo che viene eletto come nuovo master:
 *      1) Scrivo a tutti nella rete, e gli chiedo tutti i metadati dei chunk in loro possesso
 *      2) Aggiorno mano mano la tabella master
 *      3) Infine distribuisco i miei chunks a chi ha il carico minore
 *
 *  @return null
 */
function newMasterRebalancmentFn()
{
    masterTable.cleanTable();
    chunkServer.getChunk().forEach(function (server) {
        if(server.ip !== ip.getPublicIp()) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/getAllChunkData',
                method: 'GET'
            };

            var res = syncRequest('GET', obj.url);

            var receivedChunks = JSON.parse(res.getBody('utf8'));
            receivedChunks.forEach(function (chunk) {

                masterTable.addChunkRef(chunk.chunkGuid,chunk.metadata, server.ip,chunk.userId, true);
            })
        }
    });

    masterTable.printTable();

    var sended = false;
    var slaveServers = masterController.buildSlaveList();
    slaveTable.getAllChunk().forEach(function (chunk) {
        sended = false;
        var guid = chunk.chunkGuid;
        slaveServers.forEach(function (server) {
            if(!sended)
                if(!masterTable.checkGuid(server,guid)) {
                    console.log("SPEDISCO " + guid + " A " + server);
                    masterTable.addChunkRef(guid,chunk.metadata, server,chunk.userId);

                    var formData = {
                        guid: guid,
                        idUser: chunk.userId,
                        destRelPath: chunk.metadata.relPath,
                        my_file: fs.createReadStream(chunk.metadata.relPath)
                    };
                    request.post({url:'http://'+server+':6601/api/chunk/newDistributedChunk', formData: formData}, function optionalCallback(err, res) {
                        if (err) {
                            return console.error('upload failed:', err);
                        }
                        if(res.body.status === 'ACK')
                        {
                            console.log("File "+chunk.metadata.relPath+" saved in "+req.body.server);
                        }
                    });



                    sended = true;
                }
        });
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + guid);
    });
    chunkList.cleanList();
}

/**
 *  Dopo che uno slave crasha:
 *      1) Cerca tutti i chunk relativi a quello slave nella tabella
 *      2) Ribilancia quei chunk ad altri slave
 *      3) Aggiorna la tabella
 *
 *  @param slave
 *  @return null
 */
function crushedSlaveRebalancmentFn(slave)
{
    var chunkGuids = masterTable.getAllChunksBySlave(slave.ip);

    masterTable.removeFromOccupationTable(slave.ip, chunkGuids);
    var slaveServers = masterController.buildSlaveList();
    var sended = false;
    chunkGuids.forEach(function (chunks) {

        sended = false;
        var chunkguid = chunks.chunkguid;
        if(slaveServers.length!==0)
            slaveServers.forEach(function (server) {
                if (!sended)
                    if (!masterTable.checkGuid(server, chunkguid)) {
                        var oldSlave = masterTable.getOneSlaveByGuid(chunkguid);

                        if(!oldSlave)
                            console.log("NON RIESCO A TROVARE UNO SLAVE A CUI RICHIEDERE IL CHUNK");
                        else
                        {
                        console.log("SPEDISCO " + chunkguid + " A " + server + " LO SLAVE A CUI CHIEDO IL CHUNK è " + oldSlave);

                        masterTable.addChunkRef(chunks.chunkguid,chunks.metadata, server,chunks.usersId);

                        var obj = {
                            url: 'http://' + oldSlave + ':6601/api/chunk/fileDistributionReq',
                            method: 'POST',
                            json: {
                                type: "FILE_DISTRIBUTION",
                                guid: chunkguid,
                                server: server,
                                usersId: chunks.usersId
                            }
                        };
                        request(obj, function (err, res) {
                            if(err) {
                                console.log(err);
                            }
                        });

                        sended = true;
                        }
                    }

            });
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + chunkguid);

        masterTable.printTable();

    })
}


/**
 * Questa funzione aggiunge nella tabella il chunk guid e l'ip dello slave che lo possiede.
 *
 * @param slaveIp
 * @param chunkGuid
 * @return null
 */
function addChunkGuidInTableFn(slaveIp, chunkGuid)
{
    masterTable.addChunkRef(chunkGuid, slaveIp);
    masterTable.printTable();
}