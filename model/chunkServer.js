/**
 * Created by Caim03 on 13/09/17.
 */

/* Lista dei chunkServer connessi alla rete */
var chunkServer = [];

exports.pushServer = pushServerFn;
exports.popServer = popServerFn;
exports.getChunk = getChunkFn;
exports.setChunk = setChunkFn;
exports.getServerByMaxId = getServerByMaxIdFn;

function pushServerFn(server) {
    chunkServer.push(server);
}

function popServerFn(server) {
    chunkServer.splice(chunkServer.indexOf(server), 1);
}

function getServerByMaxIdFn() {
    var serverMax = chunkServer[0];
    chunkServer.forEach(function(server){
        if(server.id > serverMax.id) {
            serverMax = server;
        }
    });
    return serverMax;
}

function getChunkFn() {
    return chunkServer;
}

function setChunkFn(chunks) {
    chunkServer = chunks;
}
