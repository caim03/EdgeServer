var chunkServer = require('../model/chunkServer');
var request = require('request');
var config = require('../config/config');

/* Export delle funzionalità del masterServer */

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

exports.subscribe = subscribeFn;

exports.subscribeToBalancer = subscribeToBalancerFn;
exports.heartbeatMessage = heartbeatMessageFn;

/* TODO Read File Meatadata */
function readFileFn(req, res) {
    res.send("HTTP GET");
}

/* TODO Write File Metadata */
function writeFileFn(req, res) {
    res.send("HTTP POST");
}

/* TODO Delete File Metadata */
function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

/* TODO Update File Metadata */
function updateFileFn(req, res) {
    res.send("HTTP PUT");
}

/* Questa funzione permette ad un chunkServer di sottoscriversi al master tramite una chiamata POST */
function subscribeFn(req, res) {
    console.log("SUBSCRIBE");
    var serverObj = {};
    var found = false;
    var len = chunkServer.getChunk().length;

    if (len === 0) {
        serverObj.id = 1;
    }
    else {
        serverObj.id = (chunkServer.getChunk())[len - 1].id + 1;
    }
    serverObj.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    serverObj.freeSpace = req.body.freeSpace;
    serverObj.alive = true;
    serverObj.ageingTime = config.ageingTime;

    chunkServer.getChunk().some(function (element) {
       if (element.ip === serverObj.ip){
           res.send({status: 'NACK'});
           found = true;
           return found;
       }
    });

    if (!found) {
        chunkServer.pushServer(serverObj);

        chunkServer.getChunk().forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/topology',
                method: 'POST',
                json: {chunkServers: chunkServer.getChunk(), yourId: server.id}
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
    console.log(chunkServer.getChunk());
}

/* Questa funzione permette al master di sottoscriversi al load balancer */
function subscribeToBalancerFn(){
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'POST',
        json: {type: 'MASTER'}
    };

    request(obj, function (err, res) {
        if(err) {
            console.log(err);
        }
    })
}

/* Questa funzione è adibita all'invio periodico dei messaggi di heartbeat ai chunkServer nella rete */
function heartbeatMessageFn() {
    /* setInterval(callback, timeout, [args...]) chiama la funzione di callback ogni timeout millisecondi */
    setInterval(function () {
        console.log(chunkServer.getChunk());
        chunkServer.getChunk().forEach(function (server) {
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
                        chunkServer.popServer(server);
                    }
                }

                else{
                    server.freeSpace = res.body.freeSpace;
                    server.alive = true;
                    server.ageingTime = config.ageingTime;
                    console.log(server);
                }
            })
        })
    }, config.heartbeatTime);
}