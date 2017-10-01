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
exports.newMasterRebalancment = newMasterRebalancmentFn;
exports.crushedSlaveRebalancment = crushedSlaveRebalancmentFn;

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

/* Questa funzione permette al master di sottoscriversi al load balancer */
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

/* Questa funzione è adibita all'invio periodico dei messaggi di heartbeat ai chunkServer nella rete */
function heartbeatMessageFn() {
    /* setInterval(callback, timeout, [args...]) chiama la funzione di callback ogni timeout millisecondi */
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
                        chunkServer.splice(chunkServer.indexOf(server), 1);
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

/**
 *  Hey sono un nuovo master!
 *  1) Scrivo a tutti nella rete, e gli chiedo tutti i metadati dei chunk in loro possesso
 *  2) Aggiorno mano mano la tabella master
 *  3) Infine distribuisco i miei chunks a chi ha il carico minore
 *
 *  TODO NB Durante tutto ciò, il loadbalancer deve BUFFERIZZARE le richieste fino a ribilanciamento completato
 */
function newMasterRebalancmentFn()
{
    chunkServer.forEach(function (server) {
        var obj = {
            url: 'http://' + server.ip + ':' + config.port + '/api/chunk/metadata',
            method: 'GET'
        };

        request(obj, function (err, res) {
            if (err) {
                console.log(err);
            }

            else{

                //TODO BuildList(res.body) serve la tabella di Deb ;
            }
        })
    })


    //TODO SendMyChunks():
    //Per ogni elemento nella mia chunklist:
        //Cerco uno slave nella tabella che 1) non abbia quel chunk 2)sia ordinato in base alla disponibilità
        //Estraggo il file da spedire e lo spedisco a quel server

    //TODO fine metamorfosi a master


}


/**
 *  Dopo che uno slave crasha
 *
 *  1) Cerca tutti i chunk relativi a quello slave nella tabella
 *  2) Ribilancia quei chunk ad altri slave
 *  3) Aggiorna la tabella
 */
function crushedSlaveRebalancmentFn(slave)
{




}