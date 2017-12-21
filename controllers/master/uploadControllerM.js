var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');
var ip = require("ip");
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');
var masterController = require('./masterController');
var readFileControllerM = require('./readFileControllerM');
var pendingMetadata = require('../../model/master/pendingMetadata');
var path = require("path");

const uuidv4 = require('uuid/v4');


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
 * The master receives requests to start loading files, generate a GUID and a list of slaves.
 * The master sends the pair (guid, idClient) to each slave in the list.
 * After the answer of the server X, the master sends (GUID, server X) to client.
 *
 * @param req
 * @param res1
 */
function sendSlaveListAndGuidFn(req, res1) {

    if(req.body.type === "METADATA"){

        var guid = uuidv4();
        console.log("<-  Received metadata for file "+req.body.fileName);

        var slavesList = [];

        console.log("Generated GUID: "+guid);

        pendingMetadata.addFileMetadata(guid, req.body.fileName, req.body.destRelPath, req.body.extension, req.body.sizeFile, req.body.idUser, req.body.lastModified);

        var slaveServers = masterController.buildSlaveList();
        console.log("Slaves list:");
        slaveServers.forEach(function (server) {
            console.log(server);
        });

        var idUser = req.body.idUser;
        slaveServers.forEach(function (server) {
            var objToSlave = {
                url: 'http://' + server + ':6601/api/chunk/newChunkGuidMaster',
                method: 'POST',
                json: {
                    type: "GUID_MASTER",
                    guid: guid,
                    idUser: idUser
                }
            };
            console.log("->  Sending ("+guid+" - "+idUser+") to server "+server);
            request(objToSlave, function (err, res2) {
                if (err) {
                    console.log(err);
                }

                if(!err && res2.statusCode === 200)
                {
                    console.log("<-  Received ACK from "+server);
                    console.log("->  Authorizing the client "+idUser+" to contact the server "+server);

                    slavesList.push(server);
                    if(slavesList.length=== config.replicationNumber)
                    {
                        var objGuidSlaves = {
                            type: "UPINFO",
                            guid: guid,
                            ipSlaves: slavesList
                        };
                        res1.send(objGuidSlaves);
                    }
                }
            });
        });
    }
}

/**
 * Questa funzione permette al master di effettuare dei controlli sui metadati ricevuti dal client e,
 * in caso positivo, li memorizza.
 *
 * @param req
 * @param res
 */
function checkAndSaveMetadataFn(req, res) {

    if(req.body.type === 'UPLOADING_SUCCESS') {
        console.log(req.body.slaveIp+"-> upload completed, saving (" + req.body.chunkGuid + " - " + req.body.userId + ") to master table.\n");

        var metadata = '';

        var foundMetaD = pendingMetadata.checkIfPending(req.body.chunkGuid, req.body.userId);
        if (foundMetaD) {
            metadata = {
                name: foundMetaD.name,
                relPath: foundMetaD.relPath,
                size: foundMetaD.size,
                extension: foundMetaD.extension,
                lastModified: foundMetaD.lastModified
            };
            masterTable.addChunkRef(req.body.chunkGuid, metadata, req.body.slaveIp, req.body.userId,false);
            console.log("Added "+req.body.chunkGuid+" in master table with metadata!\n");
        }

        else console.log("Error adding metadata file to table.");
        res.send({status: 'OK',metadata : metadata});
    }
}