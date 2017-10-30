var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');
var ip = require("ip");
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');
var masterController = require('./masterController');
var pendingMetadata = require('../../model/master/pendingMetadata');
var path = require("path");


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
 * @param res
 */
function sendSlaveListAndGuidFn(req, res) {

    if(req.body.type == "METADATA"){

        //Genera GUID
        var guid = guidGeneratorFn();
        console.log("<-  Received metadata for file "+req.body.fileName);

        console.log("Generated GUID: "+guid);

        //save metadata
        pendingMetadata.addFileMetadata(guid, req.body.fileName, req.body.destRelPath, req.body.extension, req.body.sizeFile, req.body.idClient, req.body.lastModified);

        //genera slaveList
        var slaveServers = masterController.buildSlaveList();
        console.log("Slaves list:");
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
            console.log("->  Sending ("+guid+" - "+idClient+") to server "+server);
            request(objToSlave, function (err, res) {
                if (err) {
                    console.log(err);
                }
                if(res.body.status == 'OK')
                {
                    console.log("<-  Received ACK from "+server);
                    console.log("->  Authorizing the client "+req.body.ipClient+" to contact the server "+server);
                    //SEND TO CLIENT THE AUTHORIZATION TO SEND REQUEST TO SLAVES.
                    var objGuidSlaves = {
                        url: 'http://' + req.body.ipClient  + ':6603/api/client/sendRequest',
                        method: 'POST',
                        json: {
                            type: "UPINFO",     //info the customer needs from master to update a file
                            guid: guid,
//                            slaveList: slaveServers,
                            origPath: req.body.origAbsPath,
                            destPath: req.body.destRelPath,
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
        res.send({status: 'OK'});
    }

}

function checkAndSaveMetadataFn(req, res) {


    if(req.body.type == 'UPLOADING_SUCCESS') {
        console.log(req.body.ipServer+"-> upload completed, saving (" + req.body.chunkGuid + " - " + req.body.userId + ") to master table.\n");

        var ipSlave = req.connection.remoteAddress;

        //    console.log(req.body.chunkGuid+"..."+req.body.userId+"..."+req.body.ipServer+'\n');

        var metadata = '';

        var foundMetaD = pendingMetadata.checkIfPending(req.body.chunkGuid, req.body.userId);
        if (foundMetaD) {
            metadata = {
                name: foundMetaD.name,
                absPath: foundMetaD.absPath,
                size: foundMetaD.size,
                extension: foundMetaD.extension,
                lastModified: foundMetaD.lastModified
            };
            masterTable.addChunkRef(req.body.chunkGuid, metadata, req.body.ipServer, req.body.userId);
            console.log("Added "+req.body.chunkGuid+" in master table with metadata\n!");




            //E' una prova!!!!!!!!!!!!!!!!!!!!!!!!!!!
         /*   var matchTable = masterTable.getAllMetadataByUser('Debora');
            console.log("^^^^^^^^^^^^^^^^^^^^^^");
            console.log("GUID con Debora: ");
            matchTable.forEach(function (t) {

                console.log(t.metadataTable.absPath);
            });
            console.log("^^^^^^^^^^^^^^^^^^^^^^");*/

            // pendingMetadata.removeMetaD(req.body.chunkGuid, req.body.userId)
        }
        else console.log("Error adding metadata file to table.");
        //    console.log("TABELLA.....");
        //    masterTable.printTable();


    /*    var objMetadataSaved = {
            url: 'http://' + ipSlave + ':6601/api/chunk/metadataSaved',
            method: 'POST',
            json: {
                type: "METADATA_SAVED",
                name: metadata[0].name
            }
        };*/
        res.send({status: 'OK',metadata : metadata});
    }
}