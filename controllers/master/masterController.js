var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');



/* Export delle funzionalità del masterServer */

exports.sendChunkGuidToSlaves = sendChunkGuidToSlavesFn;
exports.buildSlaveList = buildSlavesListFn;


/**
 *Il master invia il Chank GUID ricevuto dal client a replicationNumber server slaves.
 *Prima costruisce la lista di slaves (buildSlavesList)
 *Poi invia, ed aggiunge alla propria master table l'informazione.
 *
 */
//NON PIU' NECESSARIA. DA CANCELLARE.
function sendChunkGuidToSlavesFn(req, res)
{
    var slaveServers = buildSlavesListFn();
    // console.log("SLAVES SCELTI " + slaveServers);
    if(req.body.type == "CHUNK")
    {
        res.send({status: 'ACK'});
        slaveServers.forEach(function (server) {
            var obj = {
                url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                method: 'POST',
                json: {
                    type: "CHUNK",
                    guid: req.body.guid,
                    ipServer: server
                }
            };

            request(obj, function (err, res) {
                addChunkGuidInTableFn(server, res.body.guid);
                if (err){
                    // console.log(err);
                    return;
                }
             //TODO X DEBORA invio fisico del chunk 1) Il master o il client  -> post (slaveServers)
            })
        })
    }
}


/**
 * Crea una lista di replicationNumber ip, che corrispondono agli slaves più vuoti:
 * Come prima cosa inserisce nella lista gli slaves completamente vuoti(nuovi arrivati),
 * in seguito ci aggiunge gli slaves ordinati per occupazione nella tabella
 *
 * @return slaveList
 */
function buildSlavesListFn() {

    var slaveList = [];

    var numberOfSlaves = config.replicationNumber;

    var ipOccupation = masterTable.masterTableOccupation();

    chunkServer.getChunk().forEach(function (server) {

        var found = false;

        ipOccupation.forEach(function (table) {
            if(server.ip === table.slaveIp)
                found= true;
        });

        if(!found && numberOfSlaves>0)
        {
            slaveList.push(server.ip);
            numberOfSlaves--;
        }
    });

    if(numberOfSlaves>0)
        ipOccupation.forEach(function (table) {
           if(numberOfSlaves>0) {
               slaveList.push(table.slaveIp);
               numberOfSlaves--;
           }
        });

    return slaveList;
}