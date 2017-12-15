/**
 * Created by Caim03 on 23/11/17.
 */

var request = require('request');
var config = require('../../config/config');
var master = require('../../model/masterServer');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var masterTopologyController = require('../master/topologyController');
var slaveTopologyController = require('../slave/topologyController');
var rebalancingController = require('../master/rebalancingController');
var app = require('../../app');
var chunkList = require('../../model/chunkList');

var slaveTable = require('../../model/slave/slaveTable');
var masterTable = require('../../model/masterTable');

exports.receiveProclamation = receiveProclamationFn;
exports.startElection = startElectionFn;

/**
 * Questa funzione permette ad ogni chunk server di ricevere il risultato dell'algoritmo di elezione,
 * apprendendo l'identità del nuovo master.
 *
 * @param req
 * @param res
 * @return null
 * */
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
        slaveTopologyController.waitHeartbeat();
    }

    console.log(master.getMasterServer());
}

/**
 * Questa funzione permette ad un chunk server, che si è accorto del fallimento del master, di avviare l'algoritmo
 * di elezione, in grado di selezionare un nuovo master.
 *
 * @return null
 * */
function startElectionFn() {
    console.log("START ELECTION");

    var myself;
    var not_master = false;

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
                        // console.log(err);
                    }
                });
            }
        });

        console.log("END PROCLAMATION");

        chunkServers.popServer(myself);
        serverInfo.setInfoMaster(true);
        rebalancingController.newMasterRebalancment();
        app.startMaster(true);
        //
        // masterTopologyController.subscribeToBalancer();
        // console.log(chunkServers.getChunk());
        // masterTopologyController.heartbeatMessage();
    }
}