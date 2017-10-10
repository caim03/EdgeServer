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
var chunkList = require('../model/chunkList');

var masterTable = require('../model/masterTable');

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
exports.getAllMetaData = getAllMetaDataFn;

exports.receiveProclamation = receiveProclamationFn;

exports.sendChunkGuidToMaster = sendChunkGuidToMasterFn;
exports.sendAckToMaster = sendAckToMasterFn;


/* TODO Funzione adibita alla lettura di un chunk */
function readFileFn(req, res) {
    res.send("HTTP GET");
}

/* TODO Funzione adibita alla scrittura di un chunk */
function writeFileFn(req, res) {

    var chunkMetaData = {};

    chunkMetaData.dim = req.body.dim;
    chunkMetaData.id = req.body.id;
    chunkMetaData.location = req.body.location;

    chunkList.pushChunk(chunkMetaData);

    res.send("OK");

    //TODO salva il chunk

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
    master.setMasterServerIp(res.getBody('utf8'));  // utf8 convert body from buffer to string
}

/* Questa funzione preleva la lista di tutti i chunkServer connessi, inviata dal masterServer ogni volta che
 * un nuovo chunkServer si connette alla rete o TODO quando un chunkServer esce dalla rete */
function genTopologyFn(req, res) {
    chunkServers.setChunk(req.body.chunkServers);
    serverInfo.setInfoId(req.body.yourId);
    console.log(chunkServers.getChunk());
    console.log(serverInfo.getInfo());
}

/* Questa funzione permette ad un chunkServer di sottoscriversi al master */
function subscribeToMasterFn() {
    var obj = {
        url: 'http://' + master.getMasterServerIp() + ':6601/api/master/subscribe',
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
        master.setMasterServerIp(ip);
        chunkServers.getChunk().some(function (server) {
            if(server.ip === ip) {
                masterServer = server;
                return true;
            }
        });

        chunkServers.popServer(masterServer);
        waitHeartbeatFn();
    }

    console.log(master.getMasterServer());
}

function startElection() {
    console.log("START ELECTION");

    var myself;
    var not_master;

    if (!serverInfo.getInfoId()) {
        console.log("CANNOT PARTICIPATE");
    }
    else {
        chunkServers.getChunk().forEach(function (server) {
            if (server.id > serverInfo.getInfoId()) {
                console.log("I'M NOT THE NEW MASTER");
                not_master = true;
            }
        });

        if (not_master) {
            return;
        }

        console.log("I'M THE NEW MASTER");

        chunkServers.getChunk().forEach(function (server) {
            if (server.id === serverInfo.getInfoId()) {
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
        serverInfo.setInfoMaster(true);

        masterController.newMasterRebalancment();

        masterController.subscribeToBalancer();
        console.log(chunkServers.getChunk());
        masterController.heartbeatMessage();
    }
}

function getAllMetaDataFn(req, res){

    res.send(chunkList.getChunkList());

}

//TODO DA MODIFICARE IN PRESENZA DI CLIENT
//Simula l'invio dei chunk GUID. Attualmente lo fanno gli slave ma in futuro sarà un compito che spetterà ai client.
function sendChunkGuidToMasterFn()
{
    setInterval(function () {

        var obj = {
            url: 'http://' + master.getMasterServerIp() + ':6601/api/master/newChunk',
            method: 'POST',
            json: {
                type: "CHUNK",
                guid: masterTable.guidGenerator()
            }
        };
        request(obj, function (err, res) {
            console.log("guid creato: " + obj.json.guid);
            if (err) {
                console.log(err);
            }
            else {
                console.log(res.body);
            }
        })
    }, config.randomGuidTime);
}

function sendAckToMasterFn(req, res)
{
    console.log("il server "+req.body.ipServer+" ha ricevuto il guid "+req.body.guid);


    var chunkMetaData = {};

    chunkMetaData.dim = 50;
    chunkMetaData.guid= req.body.guid;
    chunkMetaData.location = req.body.location;
    chunkList.pushChunk(chunkMetaData);

    var obj = {
         type: "ACK",
        guid: req.body.guid,
        ipServer: req.body.ipServer
    };

    res.send(obj);
}