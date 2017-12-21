var request = require('request');
var config = require('../../config/config');
var masterTable = require('../../model/masterTableDb');
var dynamoTable = require('../../model/master/dynamoTable');
var ip = require('ip');
var s3Controller = require('../s3Controller');

exports.deleteFile = deleteFileFn;

/**
 * Questa funzione permette al master di gestire la cancellazione di un file. In particolare ordina a tutti gli
 * slave che possiedono quel file di eliminarlo e invia una richiesta di cancellazione anche ad S3.
 * @param req
 * @param res1
 */

function deleteFileFn(req, res1) {

    var path = req.body.relPath;
    var user = req.body.idUser;
    var notify = false;

    console.log(req.body.idUser+" wants to delete "+req.body.relPath);
    

    var matchedTable = masterTable.getFileByUserAndRelPath(req.body.idUser, req.body.relPath);

    matchedTable.slavesIp.forEach(function (ip) {
        console.log("--> sending " + matchedTable.guid + " to "+ip.slaveIp);
    });
    var slavesReturned = [];

    if(matchedTable.slavesIp.length === 0)
    {
        console.log("STO QUA");
        if (req.body.type !== "NOTIFY_DELETE") {
            dynamoTable.deleteMetadataFromDynamo(req.body.idUser, matchedTable.guid, function (result) {
                if (result) {
                    console.log("Removed " + req.body.idUser + " - " + matchedTable.guid + " in dynamo table.");
                    notify = s3Controller.deleteFile(path, function (result) {
                        if (result) {
                            masterTable.removeByGuid(matchedTable.guid);

                            var notify = {
                                url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerNotify,
                                method: 'POST',
                                json: {
                                    type: "NOTIFY_DELETE",
                                    path: path,
                                    idUser: user
                                }
                            };
                            request(notify, function (err, res3) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("Notify successfully");
                                    res3.end();
                                }
                            });
                            res1.send({type: 'DELETE_SUCCESS'});
                        }
                        else {
                            res1.send({type: 'DELETE_ABORTED'});
                        }
                    });
                }
            });
        }
        else {
            masterTable.removeByGuid(matchedTable.guid);
            console.log(obj.json.chunkGuid + " removed in " + ip.slaveIp);
            res1.send({type: 'DELETE_SUCCESS'});
        }
    }
    else {
        matchedTable.slavesIp.forEach(function (ip) {
            var obj = {
                url: 'http://' + ip.slaveIp + ':6601/api/chunk/removeChunk',
                method: 'POST',
                json: {
                    type: "REMOVE_CHUNK",
                    chunkGuid: matchedTable.guid,
                    path: req.body.relPath
                }
            };
            request(obj, function (err, res2) {
                if (err) {
                    console.log(err);
                }
                if (res2.body.type === 'REMOVED_CHUNK') {
                    slavesReturned.push(ip.slaveIp);
                    masterTable.removeSlaveOccupation(ip.slaveIp);
                    if (slavesReturned.length === config.replicationNumber) {
                        if (req.body.type !== "NOTIFY_DELETE") {
                            dynamoTable.deleteMetadataFromDynamo(req.body.idUser, matchedTable.guid, function (result) {
                                if (result) {
                                    console.log("Removed " + req.body.idUser + " - " + matchedTable.guid + " in dynamo table.");
                                    notify = s3Controller.deleteFile(path, function (result) {
                                        if (result) {
                                            masterTable.removeByGuid(matchedTable.guid);

                                            var notify = {
                                                url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerNotify,
                                                method: 'POST',
                                                json: {
                                                    type: "NOTIFY_DELETE",
                                                    path: path,
                                                    idUser: user
                                                }
                                            };
                                            request(notify, function (err, res3) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                else {
                                                    console.log("Notify successfully");
                                                    res3.end();
                                                }
                                            });

                                            console.log(obj.json.chunkGuid + " removed in " + ip.slaveIp);
                                            res1.send({type: 'DELETE_SUCCESS'});
                                        }
                                        else {
                                            res1.send({type: 'DELETE_ABORTED'});
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            masterTable.removeByGuid(matchedTable.guid);
                            console.log(obj.json.chunkGuid + " removed in " + ip.slaveIp);
                            res1.send({type: 'DELETE_SUCCESS'});
                        }
                    }
                }
            });
        });
    }
}