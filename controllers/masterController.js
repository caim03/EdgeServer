var chunkServer = require('../model/chunkServer');

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

exports.subscribe = subscribeFn;

function readFileFn(req, res) {
    res.send("HTTP GET");
}

function writeFileFn(req, res) {
    res.send("HTTP POST");
}

function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

function updateFileFn(req, res) {
    res.send("HTTP PUT");
}

function subscribeFn(req, res) {
    var serverObj = {};
    var found = false;

    serverObj.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    serverObj.freeSpace = req.body.freeSpace;
    serverObj.alive = true;

    chunkServer.some(function (element) {
       if (element.ip === serverObj.ip){
           res.send({status: 'NACK'});
           found = true;
           return true;
       }
    });

    if (!found) {
        chunkServer.push(serverObj);
        res.send({status: 'ACK'});
    }
    console.log(chunkServer);
}