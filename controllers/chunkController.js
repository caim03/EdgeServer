/**
 * Created by Caim03 on 12/09/17.
 */
var request = require('request');
var syncRequest = require('sync-request');
var config = require('../config/config');
var master = require('../model/masterServer');
var chunkServers = require('../model/chunkServer');
var chunkList = require('../model/chunkList');

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
    chunkServers = req.body.chunkServers;
    console.log(chunkServers);
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
 * TODO In caso di timeout il chunkServer avvierà un algoritmo di elezione */
function waitHeartbeatFn(){
    timer = setTimeout(function(){
        console.log("ELEZIONE");
    }, config.waitHeartbeat);
}

function getAllMetaDataFn(req, res){

    res.send(chunkList);

}