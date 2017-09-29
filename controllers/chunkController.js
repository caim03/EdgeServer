/**
 * Created by Caim03 on 12/09/17.
 */
var request = require('request');
var syncRequest = require('sync-request');
var config = require('../config/config');
var master = require('../model/masterServer');
var chunkServers = require('../model/chunkServer');
var serverInfo = require('../model/serverInfo');
var masterController = require('../controllers/masterController');

/* Variabile timer per la gestione dei fallimenti del master e avvio di un elezione */
var timer;

/* Export delle funzionalità del chunkController */

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

exports.findMaster = findMasterFn;
exports.genTopology = genTopologyFn;
exports.subscribeToMaster = subscribeToMasterFn;

exports.receiveHeartbeat = receiveHeartbeatFn;
exports.waitHeartbeat = waitHeartbeatFn;

exports.receiveProclamation = receiveProclamationFn;

/* TODO Funzione adibita alla lettura di un chunk */
function readFileFn(req, res) {
    res.send("HTTP GET");
}

/* TODO Funzione adibita alla scrittura di un chunk */
function writeFileFn(req, res) {
    res.send("HTTP POST");
}

/* TODO Funzione adibita alla cancellazione di un chunk */
function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

/* TODO Funzione adibita all'aggiornamento di un chunk */
function updateFileFn(req, res) {
    res.send("HTTP PUT");
}

/* Questa funzione permette ad un chunkServer di rilevare il master all'interno della rete,
*  effettuando una richiesta al load balancer */
function findMasterFn() {
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'GET'
    };

    var res = syncRequest('GET', obj.url);
    master.ip = res.getBody('utf8');  // utf8 convert body from buffer to string
}

/* Questa funzione preleva la lista di tutti i chunkServer connessi, inviata dal masterServer ogni volta che
 * un nuovo chunkServer si connette alla rete o TODO quando un chunkServer esce dalla rete */
function genTopologyFn(req, res) {
    chunkServers.overrideChunk(req.body.chunkServers);
    serverInfo.id = req.body.yourId;
    console.log(chunkServers.getChunk());
    console.log(serverInfo);
}

/* Questa funzione permette ad un chunkServer di sottoscriversi al master */
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

/* Questa funzione permette di ricevere un heartbeat dal masterServer, il quale lo invierà periodicamente a tutti
 * i chunkServer nella rete */
function receiveHeartbeatFn(req, res) {
    console.log(req.body);
    clearTimeout(timer);
    res.send({
        freeSpace: 620
    });
    waitHeartbeatFn()
}

/* Questa funzione permette al chunkServer di rilevare il fallimento del master, impostando un timer che viene
 * riazzerato ogni volta che si riceve un heartbeat.
 */
function waitHeartbeatFn(){
    timer = setTimeout(function(){
        startElection();
    }, config.waitHeartbeat);
}

function receiveProclamationFn(req, res) {
    var ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    var masterServer;

    if(req.body.type === "PROCLAMATION") {
        master.ip = ip;
        chunkServers.getChunk().some(function (server) {
            if(server.ip === ip) {
                masterServer = server;
                return true;
            }
        });

        chunkServers.popServer(masterServer);
        waitHeartbeatFn();
    }

    console.log(master);
}

function startElection() {
    console.log("START ELECTION");

    var myself;
    var not_master;

    if (!serverInfo.id) {
        console.log("CANNOT PARTICIPATE");
    }
    else {
        chunkServers.getChunk().forEach(function (server) {
            if (server.id > serverInfo.id) {
                console.log("I'M NOT THE NEW MASTER");
                not_master = true;
            }
        });

        if (not_master) {
            return;
        }

        console.log("I'M THE NEW MASTER");

        chunkServers.getChunk().forEach(function (server) {
            if (server.id === serverInfo.id) {
                myself = server;
            }
            else {
                console.log("SEND PROCLAMATION");

                var obj = {
                    url: 'http://' + server.ip + ':' + config.port + '/api/chunk/proclamation',
                    method: 'POST',
                    json: {type: "PROCLAMATION"}
                };

                request(obj, function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });

        console.log("END PROCLAMATION");

        chunkServers.popServer(myself);
        config.master = true;
        masterController.subscribeToBalancer();
        console.log(chunkServers.getChunk());
        masterController.heartbeatMessage();

        // TODO distribuire i chunk tra i vari slave server
    }
}