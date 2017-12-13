var request = require('request');
var config = require('../../config/config');
var masterTable = require('../../model/masterTableDb');
var dynamoTable = require('../../model/master/dynamoTable');
var pendingReq = require('../../model/slave/pendingRequests');
var process = require('process');
var ip = require('ip');
var fs=require('fs');
var path = require("path");
var s3Controller = require('../s3Controller');

exports.deleteFile = deleteFileFn;

function deleteFileFn(req, res1) {

    var path = req.body.relPath;
    var user = req.body.idUser;
    var notify = false;

    console.log(req.body.idUser+" want to delete "+req.body.relPath);

  /*  console.log("MMMMMMMMM\n");
    masterTable.printTable();
    console.log("MMMMMMMMM\n");
*/

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
            //   console.log("^^^^^^^^"+ip.slaveIp);
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