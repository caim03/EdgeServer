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
 * The master sends the pair (guid, idClient) to each slave in the list, wait .
 *
 * @param req
 * @param res
 */
/*function sendSlaveListAndGuidFn(req, res) {

    if(req.body.type == "METADATA"){
        var slaveServers = masterController.buildSlaveList();

        //GUID generation
        var guid = guidGeneratorFn();
        console.log("Generated GUID: "+guid);

        //SlaveList generation
        var i=0;
        console.log("The less busy servers are: ");
        slaveServers.forEach(function (server) {
            console.log(server);
            i++;
        });

        //Master sends (GUID, IdClient) to slaves
        var idClient = req.body.idClient;
        slaveServers.forEach(function (server) {
            var objToSlave = {
                url: 'http://' + server + ':6601/api/chunk/newChunkGuid',
                method: 'POST',
                json: {
                    type: "GUID",
                    guid: guid,
                    idClient: idClient
                }
            };
            console.log("Sending GUID "+objToSlave.json.guid+" and idClient "+objToSlave.json.idClient+" to slaves.");
            request(objToSlave, function (err, res) {

                //TODO RICEVERE ACK DAGLI SLAVES E AGGIUNGERE IN TABELLA.

                if (err) {
                    console.log(err);
                }
            });
        });

        console.log("NEW REQUEST FROM "+req.body.idClient);

        var obj = {
            type: "UPINFO",     //info the customer needs from master to update a file
            guid: guid,
            slaveList: slaveServers
        };
        console.log("Sending GUID and slave list to the client.");
        //master sends to the client the slave list and the generated guid to client.
        res.send(obj);
    }
}*/

function sendSlaveListAndGuidFn(req, res) {
    console.log("----------------"+req.body.extension);

    if(req.body.type == "METADATA"){

        //Genera GUID
        var guid = guidGeneratorFn();
        console.log("GUID: "+guid);
        //genera slaveList
        var slaveServers = masterController.buildSlaveList();
        var i=0;
        slaveServers.forEach(function (server) {
            console.log("***** "+i+":");
            console.log(server);
            i++;
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