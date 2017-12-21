exports.periodicBackup = periodicBackupFn;
exports.restoreGuid = restoreGuidFn;
var shell = require('shelljs');
var path = require("path");

var slaveTable = require('../../model/slave/slaveTable');
var fs=require('fs');
var s3Controller = require('../s3Controller');
var topologyController = require('../slave/topologyController');

/**
 * Questa funzione permette di salvare periodicamente i file di ogni slave su S3.
 * @param req
 * @param res
 */
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

/**
 * Questa funzione permette ad ogni slave di recuperare il guid di un file dopo il restore da S3
 * @param req
 * @param res
 */
function restoreGuidFn(req, res) {


    topologyController.receiveExtraHeartBeat();
    var guid = req.body.guid;
    var metadata = req.body.metadata;
    var userId = req.body.userId;
    //Preleva il fileStream da S3 e lo salva in locale
    var sourceFileStream = s3Controller.retrieveFile(metadata.relPath);
    shell.mkdir('-p', path.dirname(metadata.relPath));
    sourceFileStream.pipe(fs.createWriteStream(metadata.relPath)).on('finish',function(){
        slaveTable.insertChunk(guid,metadata,userId);
        res.send({status : "ACK"});
    });
}
