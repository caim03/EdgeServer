/**
 * Created by Caim03 on 23/11/17.
 */

var config = require('../../config/config');
var syncRequest = require('sync-request');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var master = require('../../model/masterServer');
var request = require('request');
var election = require('../slave/electionController');
var info = require('../../model/serverInfo');
var masterTopologyController = require('../master/topologyController');


exports.findMaster = findMasterFn;
exports.genTopology = genTopologyFn;
exports.subscribeToMaster = subscribeToMasterFn;
exports.receiveHeartbeat = receiveHeartbeatFn;
exports.waitHeartbeat = waitHeartbeatFn;

var timer;
var failCount = 0;

/**
 * Questa funzione permette ad un chunk server di rilevare l'indirizzo ip del master all'interno della rete,
 * contattando il load balancer.
 *
 * @return null
 * */
function findMasterFn() {
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'GET'
    };

    var res = syncRequest('GET', obj.url);

    if(JSON.parse(res.getBody('utf8')).status=== "ACK")
        master.setMasterServerIp(JSON.parse(res.getBody('utf8')).masterIp);  // utf8 convert body from buffer to string
    else {
        console.log("there isn't a master in this fog");
    }
}


/**
 * Questa funzione viene attivata dal master tramite una chiamata HTTP di tipo POST, attraverso la quale passa
 * ad ogni chunk server la lista di tutti i chunk server nella rete ogni volta che uno di loro si connette alla rete.
 *
 * @param req
 * @param res
 * @return null
 */
function genTopologyFn(req, res) {
    chunkServers.setChunk(req.body.chunkServers);
    serverInfo.setInfoId(req.body.yourId);
    console.log(chunkServers.getChunk());
    console.log(serverInfo.getInfo());

    res.send({status: 'ACK'});
}

/**
 * Questa funzione permette ad un chunk server di sottoscriversi al master e di entrare così a far parte della rete.
 *
 * @return null
 */
function subscribeToMasterFn() {
    var obj = {
        url: 'http://' + master.getMasterServerIp() + ':6601/api/master/subscribe',
        method: 'POST',
        json: {type: "SUBSCRIBE"}
    };

    request(obj, function (err, res) {
        if (err) {
            // console.log(err);
        }
        else {
            console.log(res.body);
        }
    })
}

/**
 * Questa funzione permette ad un chunk server di ricevere un messaggio di tipo heartbeat tramite una REST
 *
 * @param req
 * @param res
 * @return null
 */
function receiveHeartbeatFn(req, res) {
    failCount = 0;
    console.log(req.body);
    clearTimeout(timer);
    res.send({
        freeSpace: 620
    });
    waitHeartbeatFn()
}

/**
 * Questa funzione permette al chunk server di rilevare il fallimento del master, impostando un intervallo di tempo,
 * entro il quale ci si aspetta di ricevere un heartbeat dal master.
 * Ogni volta che si riceve l'heartbeat il timer viene riazzerato.
 *
 * @return null
 * */
function waitHeartbeatFn(){
    timer = setTimeout(function(){
        if(election.startElection() === true) {
            failCount++;
            if(failCount === 3){
                chunkServers.popServer(chunkServers.getServerByMaxId());
                failCount = 0;
            }
            clearTimeout(timer);
            waitHeartbeatFn();
        }
    }, config.waitHeartbeat);
}

