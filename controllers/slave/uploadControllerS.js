var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var master = require('../../model/masterServer');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var masterController = require('../master/masterController');
var chunkList = require('../../model/chunkList');
var pendingReq = require('../../model/slave/pendingRequests');

var shell = require('shelljs');

var formidable = require('formidable');

var multiparty = require('multiparty');
var util = require('util');
var process = require('process');
var ip = require('ip');
var fs=require('fs');
var chunkList = require('../../model/chunkList');
var mkdirp = require('mkdirp');
var slaveTable = require('../../model/slave/slaveTable');

const Writable = require('stream');
var path = require("path");

exports.savePendingRequest = savePendingRequest;

exports.uploadFile = uploadFileFn;

exports.checkIfPending = checkIfPendingFn;

/**
 * A slave receives (guid, ipClient) authorized from master and saves temporally the pending request.
 *
 * @param req
 * @param res
 */
function savePendingRequest(req, res) {

    if(req.body.type == "GUID_MASTER")
    {
        pendingReq.addNewReq(req.body.guid, req.body.idClient);
        console.log("("+req.body.guid+" - "+req.body.idClient+") saved as pending request!");
        console.log("->  Sending ack to master...\n");
    }
    res.send({ ipSlave: ip.address(), status: 'OK'});
}

/**
 *The slave checks if the request from the client was previously authorized by the master.
 * @param req
 * @param res
 */
function checkIfPendingFn(req, res) {

  //  console.log("PENDING REQUESTS:");
  //  pendingReq.printTable();
  //  console.log("\n");
    if(req.body.type == 'GUID_CLIENT') {
        console.log("<-  Received ("+req.body.guid+" - "+req.body.idClient+") from client.");
        if (pendingReq.checkIfPending(req.body.guid, req.body.idClient)) {
            console.log("("+req.body.guid + " - " + req.body.idClient + ") founded as pending, authorizing client to send file.\n");
            var obj = {
                type: "ACK_PENDING",
                guid: req.body.guid,
                ipServer: ip.address()
            };
            res.send(obj);
        }
        else console.log("You have not been authorized by server to upload " + req.body.guid + " in " + ip.address());
    }
}

/**
 * The slave saves the file received by the client.
 *
 * @param req
 * @param res
 */
function uploadFileFn(req, res) {

    //TODO Da verificare: il caricamento effettivo del file avviene dopo aver comunicato al master di averlo salvato???

    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];

    console.log("...UPLOADING FILE...");

    var chunkData = {};

    form
        .on('field', function (field, value) {
            fields.push([field, value]);
        })
        .on('file', function (field, file) {
            files.push([field, file]);
        })
        .on('fileBegin', function (name, file) {
         /*   if (!fs.existsSync(fields[1][1]))
                fs.mkdirSync(fields[1][1]);*/

            shell.mkdir('-p', path.dirname(fields[1][1] + '/' + fields[2][1]));

            file.path = fields[1][1] + '/' + fields[2][1];
            pendingReq.removeReq(fields[0][1], fields[1][1]);

            //INVIO GUID-USER AL MASTER DA CONFRONTARE NELLA PENDING METADATA TABLE.
            console.log("->  Sending ("+fields[0][1]+" - "+fields[1][1]+") to master.");

               var objFileSaved = {
                   url: 'http://' + master.getMasterServerIp() + ':6601/api/master/checkMetadata',
                   method: 'POST',
                   json: {
                       type: "UPLOADING_SUCCESS",
                       ipServer: ip.address(),
                       chunkGuid: fields[0][1],
                       userId: fields[1][1]
                   }
               };


            chunkData.guid= fields[0][1];
            chunkData.userId = fields[1][1];
            request(objFileSaved, function (err, res) {
                    if (err) {
                           console.log(err);
                       }

                    if(res.body.status == 'OK')
                    {
                        chunkData.metadata = res.body.metadata;
                        slaveTable.insertChunk(chunkData.guid,chunkData.metadata,chunkData.userId);
                        var obj = {
                            url: 'http://' + req.connection.remoteAddress + ':6603/api/client/fileSavedSuccess',
                            method: 'POST',
                            json: {
                                type: "FILE_SAVED_SUCC",
                                nameFile: file.name
                            }
                        };
                        request(obj, function (err, res) {
                            if(err)
                                console.log(err);
                        })

                    }
               });


                   })
                   .on('end', function () {
                       console.log('-> upload done!'+'\n');

                       //                    res.writeHead(200, {'content-type': 'text/plain'});
              //         res.statusCode = 200;
                       res.send({status: 'ACK'});
               });
               form.parse(req);
               req.on('end', function() {
                   //    writeStream.end();
                   //    res.statusCode = 200;
                   //    res.end("file.txt");
               });


    // chunkList.pushChunk(chunkMetaData);

  //  console.log("Chunk list: ");
  //  console.log(chunkList.getChunkList());

}