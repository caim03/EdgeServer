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

    console.log("Sono "+req.body.idUser);
    console.log("Voglio cancellare "+req.body.relPath);
/*    console.log("---------------\n");
    masterTable.printTable();
    console.log("---------------\n"); */

    console.log("MMMMMMMMMMMMMMMMMMMMMM\n");
    masterTable.printTable();
    console.log("MMMMMMMMMMMMMMMMMMMMMM\n");


    console.log("Cerco: "+req.body.idUser+" ... "+req.body.relPath);

    var matchedTable = masterTable.getFileByUserAndRelPath(req.body.idUser, req.body.relPath);

    console.log("---------------\n");
    console.log(matchedTable);
    console.log("---------------\n");

    var slavesReturned = [];

    var tempIp = ['172.17.0.4', '172.17.0.6'];

 /*   matchedTable.slavesIp.forEach(function (ip) {
       console.log("^^^^^^^^"+ip.slaveIp);
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
               console.log("Chunk removed in "+obj.json.chunkGuid);
           }
       });

    });*/

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

                    //TODO rimuovere da master table
                    console.log(obj.json.chunkGuid+" removed in "+ip);
                    res1.send({type: 'DELETE_SUCCESS'});
                }
            }
        });
    });
}