exports.periodicBackup = periodicBackupFn;
exports.restoreGuid = restoreGuidFn;
var shell = require('shelljs');
var path = require("path");

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

function restoreGuidFn(req, res) {


    var guid = req.body.guid;
    var metadata = req.body.metadata;
    //Preleva il fileStream da S3 e lo salva in locale
    var sourceFileStream = s3Controller.retrieveFile(metadata.relPath);
    shell.mkdir('-p', path.dirname("prova/" + metadata.relPath));
    // copyFile(sourceFileStream,"prova/" + metadata.relPath);
    //TODO controllo errore!
    sourceFileStream.pipe(fs.createWriteStream("prova/" + metadata.relPath));

    //TODO AGGIUNGERE IL GUID ALLA SLAVETABLE

    res.send({status : "ACK"});



}

//
// function copyFile(sourceFileStream, target, cb) {
//     var cbCalled = false;
//
//     var wr = fs.createWriteStream(target);
//     wr.on("error", function(err) {
//         done(err);
//     });
//     wr.on("close", function(ex) {
//         done();
//     });
//     sourceFileStream.pipe(wr);
//
//     function done(err) {
//         if (!cbCalled) {
//             cb(err);
//             cbCalled = true;
//         }
//     }
// }