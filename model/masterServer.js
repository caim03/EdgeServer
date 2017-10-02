/**
 * Created by Caim03 on 13/09/17.
 */

/* Informazioni del masterServer */
var masterServer = {};

exports.getMasterServer = getMasterServerFn;
exports.setMasterServer = setMasterServerFn;
exports.getMasterServerIp = getMasterServerIpFn;
exports.setMasterServerIp = setMasterServerIpFn;

function getMasterServerFn() {
    return masterServer;
}

function setMasterServerFn(server) {
    masterServer = server;
}

function getMasterServerIpFn() {
    return masterServer.ip;
}

function setMasterServerIpFn(ip) {
    masterServer.ip = ip;
}