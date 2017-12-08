var S3FS = require('s3fs');
var s3Config = require('../config/s3Configuration');
var multipart = require('connect-multiparty');

var multipartyMiddlewate = multipart();

var s3fsImpl = null;

exports.setS3Connection = setS3ConnectionFn;
exports.saveFile = saveFileFn;

function setS3ConnectionFn() {

    if (s3fsImpl === null) {
        s3fsImpl = new S3FS(s3Config.bucketName, {
            accessKeyId: s3Config.accessKeyID,
            secretAccessKey: s3Config.secretAccessKeyId
        });
        s3fsImpl.create();
    }
    return s3fsImpl;
}


function saveFileFn(filename, fileStream) {
    s3fsImpl.writeFile(filename, fileStream).then(function () {
        console.log(filename + " saved!");
    }).catch(function (err) {
        console.log(err);
    });


}

