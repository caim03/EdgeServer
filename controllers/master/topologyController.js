/**
 * Created by Caim03 on 23/11/17.
 */

var chunkServer = require('../../model/chunkServer');
var config = require('../../config/config');
var request = require('request');
var rebalancingController = require('./rebalancingController');
var app = require('../../app');
var master = require('../../model/masterServer');
var hbIntervalId;
var backupControllerM = require("./backupControllerM");

exports.subscribe = subscribeFn;
exports.subscribeToBalancer = subscribeToBalancerFn;
exports.heartbeatMessage = heartbeatMessageFn;


/**
 * Questa funzione permette ad un server chunk di sottoscriversi al master tramite una chiamata HTTP
 * di tipo POST. In questo modo il master riesce a creare una topologia dell'intera rete.
 *
 * @param req
 * @param res
 * @return null
 */
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
            })
        })
    }
    console.log(chunkServer.getChunk());
}


/**
 * Questa funzione permette al master di sottoscriversi al load balancer. In questo modo,
 * ogni volta che un chunk server ha bisogno di sapere l'indirizzo del master può reperirlo dal load balancer al
 * quale si è sottoscritto.
 * La sottoscrizione avviene attraverso una chiamata HTTP di tipo POST al load balancer.
 *
 * @return null
 */
function subscribeToBalancerFn(proclamation) {

    console.log("..."+proclamation);
    var type;
    var oldMaster;
    if (!proclamation) {
        type = "MASTER";
        oldMaster = null;
    }
    else {
        type = "PROCLAMATION";
        oldMaster = master.getMasterServerIp();
    }

    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'POST',
        json: {
            type: type,
            oldMaster: oldMaster
        }
    };

    console.log("url gateway: "+obj.url);

    request(obj, function (err, res) {

        if (err) {
            console.log(err);
        }
        else if (res.body.status === "ACK") {
            console.log("Subscribed to load balancer");
        }
        else if (res.body.status === "MASTER_ALREADY_EXISTS") {
            console.log("Master already exists at " + res.body.masterIp);

            clearInterval(hbIntervalId);
            backupControllerM.stopPeriodicBackup();
            app.startSlave();

        }


    })
}



/**
 * Questa funzione permette al master di capire, mediante l'invio di messaggi temporizzati, detti heartbeat,
 * quali chunk server sono ancora in esecuzione.
 * In questo modo il master può riorganizzare la rete in base ai server ancora attivi.
 * La funzione viene chiamata ogni intervallo di tempo specificato all'interno del file di configurazione 'config.js'.
 *
 * @return null
 */
function heartbeatMessageFn() {
    /* setInterval(callback, timeout, [args...]) chiama la funzione di callback ogni timeout millisecondi */
    hbIntervalId = setInterval(function () {
        chunkServer.getChunk().forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/heartbeat',
                method: 'POST',
                json: {type: "HEARTBEAT"},
                timeout: config.heartbeatTime/2
            };

            console.log("MANDO HB: " + server.ip);

            request(obj, function (err, res) {
                if (err) {
                    console.log("HEARTBEAT DI " + server.ip + " NON RICEVUTO");
                    console.log(err.code === 'ETIMEDOUT');
                    server.ageingTime--;

                    if (server.ageingTime === 0){
                        console.log(server.ip + " CRUSHED");
                        chunkServer.popServer(server);
                        rebalancingController.crushedSlaveRebalancment(server);
                        // TODO aggiornare la lista di ogni slave

                        console.log("UPDATE SLAVE TABLE");

                        chunkServer.getChunk().forEach(function (server) {
                            var updateChunk = {
                                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/topology',
                                method: 'POST',
                                json: chunkServer.getChunk()
                            };

                            request(updateChunk, function (err, res) {
                                if(err) {
                                    console.log(err);
                                }
                            })
                        })
                    }
                }

                else{
                    server.freeSpace = res.body.freeSpace;
                    server.alive = true;
                    server.ageingTime = config.ageingTime;
                    console.log("HEARTBEAT DI " + server.ip + " RICEVUTO");
                }
            })
        })
    }, config.heartbeatTime);
}