/**
 * Created by Caim03 on 07/12/17.
 */
var S3FS = require('s3fs');
var s3Config = require('../config/s3Configuration');
var multipart = require('connect-multiparty');

var multipartyMiddleware = multipart();

var s3fsImpl = null;

exports.setS3Connection = setS3ConnectionFn;
exports.saveFile = saveFileFn;
exports.deleteFile = deleteFileFn;

function setS3ConnectionFn() {
    if(s3fsImpl === null) {
        s3fsImpl = new S3FS(s3Config.bucketName, {
            accessKeyId: s3Config.accessKeyID,
            secretAccessKey: s3Config.secretAccessKeyId
        });
        s3fsImpl.create();
    }
    return s3fsImpl;
}

function saveFileFn(filename, fileStream) {
    s3fsImpl.writeFile(filename, fileStream)
        .then(function(){
            console.log("OK");
        })
        .catch(function(err) {
            console.log(err);
        })
}

function deleteFileFn(path) {
    s3fsImpl.unlink(path)
        .then(function() {
            console.log("Il file: " + path + " è stato eliminato");
            return true;
        }, function(error) {
            console.log(error);
            return false;
        });
}