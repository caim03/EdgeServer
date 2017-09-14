var chunkServer = require('../model/chunkServer');
var request = require('request');
var config = require('../config/config');

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

exports.subscribe = subscribeFn;

exports.subscribeToBalancer = subscribeToBalancerFn;
exports.heartbeatMessage = heartbeatMessageFn;

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
    console.log("SUBSCRIBE");
    var serverObj = {};
    var found = false;

    serverObj.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    serverObj.freeSpace = req.body.freeSpace;
    serverObj.alive = true;
    serverObj.ageingTime = config.ageingTime;

    chunkServer.some(function (element) {
       if (element.ip === serverObj.ip){
           res.send({status: 'NACK'});
           found = true;
           return found;
       }
    });

    if (!found) {
        chunkServer.push(serverObj);

        chunkServer.forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/topology',
                method: 'POST',
                json: {chunkServers: chunkServer}
            };
            request(obj, function (err, res) {
                if (err){
                    console.log(err);
                    return;
                }
                console.log(res);
            })
        })
    }
    console.log(chunkServer);
}

function subscribeToBalancerFn(){
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'POST',
        json: {type: 'MASTER'}
    };

    request(obj, function (err, res) {
        console.log(res);
    })
}

function heartbeatMessageFn() {
    setInterval(function () {
        chunkServer.forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/heartbeat',
                method: 'POST',
                json: {type: "HEARTBEAT"}
            };

            request(obj, function (err, res) {
                if (err) {
                    console.log(err);
                    server.ageingTime--;

                    if (server.ageingTime === 0){
                        console.log("AMMAZZAMOLO");
                    }
                }

                else{
                    server.freeSpace = res.body;
                    server.alive = true;
                    server.ageingTime = config.ageingTime;
                    console.log(server);
                }
            })
        })
    }, 10000);
}