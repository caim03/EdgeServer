/**
 * Created by Caim03 on 12/09/17.
 */
var request = require('request');
var syncRequest = require('sync-request');
var config = require('../config/config');
var master = require('../model/masterServer');
var chunkServers = require('../model/chunkServer');

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

exports.findMaster = findMasterFn;
exports.genTopology = genTopologyFn;
exports.subscribeToMaster = subscribeToMasterFn;

exports.receiveHeartbeat = receiveHeartbeatFn;

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

function findMasterFn() {
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'GET'
    };

    var res = syncRequest('GET', obj.url);
    master.ip = res.getBody('utf8');  // utf8 convert body from buffer to string
}

function genTopologyFn(req, res) {
    chunkServers = req.body.chunkServers;
    console.log(chunkServers);
}

function subscribeToMasterFn() {
    var obj = {
        url: 'http://' + master.ip + ':6601/api/master/subscribe',
        method: 'POST',
        json: {type: "SUBSCRIBE"}
    };

    request(obj, function (err, res) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(res.body);
        }
    })
}

function receiveHeartbeatFn(req, res) {
    console.log(req.body);
    res.send({
        freeSpace: 620
    });
}