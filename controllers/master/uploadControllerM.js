var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');
var ip = require("ip");
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');
var masterController = require('./masterController');


exports.sendSlaveListAndGuid = sendSlaveListAndGuidFn;

exports.guidGenerator = guidGeneratorFn;

function guidGeneratorFn() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/**
 * The master receives requests to start loading files, generate a GUID, a list of slaves and sends them to client
 * The master sends the pair (guid, idClient) to each slave in the list.
 *
 * @param req
 * @param res
 */
function sendSlaveListAndGuidFn(req, res) {
//    console.log("----------------"+req.body.extension);

    if(req.body.type == "METADATA"){

        //Genera GUID
        var guid = guidGeneratorFn();
        console.log("GUID: "+guid);
        //genera slaveList
        var slaveServers = masterController.buildSlaveList();
        console.log("Slaves list: ")
        slaveServers.forEach(function (server) {
            console.log(server);
        });

        //Master sends (GUID, IdClient) to slaves
        var idClient = req.body.idClient;
        slaveServers.forEach(function (server) {
            var objToSlave = {
                url: 'http://' + server + ':6601/api/chunk/newChunkGuidMaster',
                method: 'POST',
                json: {
                    type: "GUID_MASTER",
                    guid: guid,
                    idClient: idClient
                }
            };
            console.log("Sto per inviare "+objToSlave.json.guid+"..."+objToSlave.json.idClient+" agli slaves.");
            request(objToSlave, function (err, res) {

                //TODO RICEVERE ACK DAGLI SLAVES E AGGIUNGERE IN TABELLA.

                if (err) {
                    console.log(err);
                }
            });
        });

        var obj = {
            type: "UPINFO",     //info the customer needs from master to update a file
            guid: guid,
            slaveList: slaveServers
        };

        res.send(obj);


    }
}