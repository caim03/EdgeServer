exports.periodicBackup = periodicBackupFn;

var slaveTable = require('../../model/slave/slaveTable');
var fs=require('fs');
var s3Controller = require('../s3Controller');

function periodicBackupFn(req,res) {

    if(req.body.type === "BACKUP") {

        req.body.guids.forEach(function (guid) {

            var chunk = slaveTable.getChunk(guid);


            var file = fs.createReadStream(chunk.metadata.relPath);

            s3Controller.saveFile(chunk.metadata.relPath, file);



        });


        res.send({status : "ACK"});
    }
    else
        res.send({status : "BAD_REQUEST"});

}