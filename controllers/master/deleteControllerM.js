var request = require('request');
var config = require('../../config/config');
var masterTable = require('../../model/masterTableDb');
var pendingReq = require('../../model/slave/pendingRequests');
var process = require('process');
//var fse = require('fs-extra');
var ip = require('ip');
var fs=require('fs');
var path = require("path");

exports.deleteFile = deleteFileFn;

function deleteFileFn(req, res1) {

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

    matchedTable.slavesIp.forEach(function (ip) {
    //   console.log("^^^^^^^^"+ip.slaveIp);
       var obj = {
           url: 'http://' + ip.slaveIp + ':6601/api/chunk/removeChunk',
           method: 'POST',
           json: {
               type: "REMOVE_CHUNK",
               chunkGuid: matchedTable.guid
           }
       };
       request(obj, function (err, res2) {
           if (err) {
               console.log(err);
           }
           if(res2.body.type === 'REMOVED_CHUNK')
           {
               slavesReturned.push(ip.slaveIp);
               masterTable.removeSlaveOccupation(ip.slaveIp);
               if(slavesReturned.length=== config.replicationNumber)
               {

                   masterTable.removeByGuid(matchedTable.guid);
                   console.log(obj.json.chunkGuid+" removed in "+ip.slaveIp);
                   res1.send({type: 'DELETE_SUCCESS'});
               }
           }
       });
    });
/*
    //TEST WITH STATIC IP FOR SLAVES

    var tempIp = ['172.17.0.4', '172.17.0.6'];

    tempIp.forEach(function (ip) {
        var obj = {
        url: 'http://' + ip + ':6601/api/chunk/removeChunk',
        method: 'POST',
        json: {
            type: "REMOVE_CHUNK",
            chunkGuid: matchedTable.guid
            }
        };
        request(obj, function (err, res2) {
            if (err) {
                console.log(err);
            }
            if(res2.body.type === 'REMOVED_CHUNK')
            {
                slavesReturned.push(ip);
                if(slavesReturned.length=== config.replicationNumber)
                {

                    masterTable.removeByGuid(matchedTable.guid);
                    console.log(obj.json.chunkGuid+" removed in "+ip);
                    res1.send({type: 'DELETE_SUCCESS'});
                }
            }
        });
    });*/
}