var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');
var ip = require("ip");
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');
var masterController = require('./masterController');
var pendingMetadata = require('../../model/master/pendingMetadata');



exports.sendSlaveListAndGuid = sendSlaveListAndGuidFn;

exports.guidGenerator = guidGeneratorFn;

exports.checkAndSaveMetadata = checkAndSaveMetadataFn;

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

    if(req.body.type == "METADATA"){

        //Genera GUID
        var guid = guidGeneratorFn();
        console.log("Received metadata for file "+req.body.fileName+'\n');

        console.log("Generated GUID: "+guid);

        //save metadata
        pendingMetadata.addFileMetadata(guid, req.body.fileName, req.body.absPath, req.body.extension, req.body.sizeFile, req.body.idClient, req.body.lastModified);

        //genera slaveList
        var slaveServers = masterController.buildSlaveList();
        console.log("Slaves list:");
        slaveServers.forEach(function (server) {
            console.log(server);
        });

        console.log('\n');

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
            console.log("Sending ("+guid+" - "+idClient+") to slave "+server+'\n');
            request(objToSlave, function (err, res) {
                if (err) {
                    console.log(err);
                }
                if(res.body.status == 'OK')
                {
                    console.log("Authorizing client "+req.body.ipClient+" to contact the server "+server+'\n');
                    //SEND TO CLIENT THE AUTHORIZATION TO SEND REQUEST TO SLAVES.
                    var objGuidSlaves = {
                        url: 'http://' + req.body.ipClient  + ':6603/api/client/sendRequest',
                        method: 'POST',
                        json: {
                            type: "UPINFO",     //info the customer needs from master to update a file
                            guid: guid,
//                            slaveList: slaveServers,
                            path: req.body.absPath,
                            ipSlave: res.body.ipSlave
                        }
                    };

                    request(objGuidSlaves, function (err, res) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        });

     /*   var obj = {
            type: "UPINFO",     //info the customer needs from master to update a file
            guid: guid,
            slaveList: slaveServers
        };

        res.send(obj);*/

     res.send({status: 'OK'});
    }

}

//{name: name, absPAth: absPath, size: fileSize, extension: extension, date:date }

//{'chunkguid': chunkGuid, 'name': name, 'absPAth': absPath, 'extension': extension, 'size': size, 'idUser': idUser, 'lastModified': lastModified}

function checkAndSaveMetadataFn(req, res) {


    if(req.body.type == 'UPLOADING_SUCCESS') {
        console.log(req.body.ipServer+"-> upload completed, saving (" + req.body.chunkGuid + " - " + req.body.userId + " to master table.\n");

        //    console.log(req.body.chunkGuid+"..."+req.body.userId+"..."+req.body.ipServer+'\n');

        var metadata = [];

        var foundMetaD = pendingMetadata.checkIfPending(req.body.chunkGuid, req.body.userId);
        if (foundMetaD) {
            metadata.push({
                name: foundMetaD.name,
                absPath: foundMetaD.absPath,
                size: foundMetaD.size,
                extension: foundMetaD.extension,
                lastModified: foundMetaD.lastModified
            });
            masterTable.addChunkRef(req.body.chunkGuid, metadata, req.body.ipServer, req.body.userId);
            pendingMetadata.removeMetaD(req.body.chunkGuid, req.body.userId)
        }
        else console.log("Error adding metadata file to table.");
        //    console.log("TABELLA.....");
        //    masterTable.printTable();

        //TODO send ACK to client and slave!!!
    }
}