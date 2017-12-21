var request = require('request');
var master = require('../../model/masterServer');
var pendingReq = require('../../model/slave/pendingRequests');
var shell = require('shelljs');
var formidable = require('formidable');
var ip = require('../../model/ip');
var fs=require('fs');
var slaveTable = require('../../model/slave/slaveTable');
var path = require("path");

exports.savePendingRequest = savePendingRequest;
exports.uploadFile = uploadFileFn;
exports.checkIfPending = checkIfPendingFn;
exports.sendFile = sendFileFn;
exports.saveChunk = saveChunkFn;

/**
 * Questa funzione permette ad uno slave di ricevere l'autorizzazione dal master per salvare temporaneamente
 * la richiesta pendente.
 *
 * @param req
 * @param res
 */
function savePendingRequest(req, res) {

    if(req.body.type === "GUID_MASTER")
    {
        pendingReq.addNewReq(req.body.guid, req.body.idUser);
        console.log("("+req.body.guid+" - "+req.body.idUser+") saved as pending request!");
        console.log("->  Sending ack to master...\n");
    }
    res.statusCode = 200;
    res.send({ ipSlave: ip.getPublicIp(), guid: req.body.guid});
}

/**
 * Questa funzione permette ad uno slave di verificare l'autorizzazione di un client
 * @param req
 * @param res
 */
function checkIfPendingFn(req, res) {


    if(req.body.type === 'GUID_CLIENT') {
        console.log("<-  Received ("+req.body.guid+" - "+req.body.idUser+") from client.");
        if (pendingReq.checkIfPending(req.body.guid, req.body.idUser)) {
            console.log("("+req.body.guid + " - " + req.body.idUser + ") found as pending, authorizing client to send file.\n");
            var obj = {
                type: "ACK_PENDING",
                guid: req.body.guid,
                ipServer: ip.getPublicIp()
            };
            res.send(obj);
        }
        else console.log("You have not been authorized by server to upload " + req.body.guid + " in " + ip.getPrivateIp());
    }
}

/**
 * Questa funzione permette ad uno slave di salvare un file ricevuto dal client
 *
 * @param req
 * @param res1
 */
function uploadFileFn(req, res1) {

    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];


    console.log("...UPLOADING FILE...");
    var chunkData = {};


    form
        .on('field', function (field, value) {
            fields.push([field, value]);
        })
        .on('fileBegin', function (name, file) {
            shell.mkdir('-p', path.dirname(fields[2][1]));

            file.path = fields[2][1];

            pendingReq.removeReq(fields[0][1], fields[1][1]);
            console.log("->  Sending ("+fields[0][1]+" - "+fields[1][1]+") to master.");

            var objFileSaved = {
                url: 'http://' + master.getMasterServerIp() + ':6601/api/master/checkMetadata',
                method: 'POST',
                json: {
                    type: "UPLOADING_SUCCESS",
                    chunkGuid: fields[0][1],
                    userId: fields[1][1],
                    slaveIp: ip.getPublicIp()
                }
            };

            chunkData.guid= fields[0][1];
            chunkData.userId = fields[1][1];
            request(objFileSaved, function (err, res2) {
                if (err) {
                    console.log(err);
                }
                if(res2.body.status === 'OK')
                {
                    chunkData.metadata = res2.body.metadata;
                    slaveTable.insertChunk(chunkData.guid,chunkData.metadata,chunkData.userId);
                }
            });
        })
        .on('file', function (field, file) {
            files.push([field, file]);
        })
        .on('error', function (error) {
                console.log(error);

        })
        .on('aborted', function () {

        })
        .on('progress', function(bytesReceived, bytesExpected) {

            var percent = (bytesReceived / bytesExpected * 100) | 0;
            console.log('Uploading: %' + percent + '\r');
        })
       .on('end', function () {
           var temp_name = this.openedFiles[0].name;

           console.log("->  Notifying "+fields[1][1]+" the uploading success of "+temp_name);
           var objSuccess = {
               type: "FILE_SAVED_SUCCESS",
               nameFile: temp_name
           };
           res1.statusCode = 200;
           res1.send(objSuccess);
           console.log('-> upload done!'+'\n');
       });
       form.parse(req);
}

/**
 * Questa funzione permette ad uno slave di re-distribuire i propri file, in base al grado di replicazione, in caso
 * di fallimento da parte di un altro slave
 * @param req
 * @param res
 */
function sendFileFn(req, res) {
    if(req.body.type === 'FILE_DISTRIBUTION') {
            var foundChunk = slaveTable.getChunk(req.body.guid);
            if (foundChunk) {
                req.body.usersId.forEach(function (user) {
                    var formData = {
                        guid: req.body.guid,
                        idUser: user.userId,
                        destRelPath: foundChunk.metadata.relPath,
                        my_file: fs.createReadStream(foundChunk.metadata.relPath)
                    };
                    request.post({url:'http://'+req.body.server+':6601/api/chunk/newDistributedChunk', formData: formData}, function(err, res) {
                        if (err) {
                            return console.error('upload failed:', err);
                        }
                        if(JSON.parse(res.body).status === "ACK")
                        {
                            console.log("File "+foundChunk.metadata.relPath+" saved in "+req.body.server);
                        }
                    });
                });

            }
            else console.log("Chunk " + req.body.guid+" - "+ user + " NON trovato.");
    }
    res.send({
        status: 'OK'
    });
}

function saveChunkFn(req, res) {

    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];
    form
        .on('field', function (field, value) {
            fields.push([field, value]);
        })
        .on('file', function (field, file) {
            files.push([field, file]);
        })
        .on('fileBegin', function (name, file) {

            shell.mkdir('-p', path.dirname(fields[2][1]));
            file.path = fields[2][1];
            console.log("Saving file in "+file.path);

        })
        .on('end', function () {
                console.log('-> upload done!'+'\n');
                res.send({status: 'ACK'});
        });
        form.parse(req);

}
