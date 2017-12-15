/**
 * Created by Caim03 on 13/09/17.
 */

/* Lista dei chunkServer connessi alla rete */
var chunkServer = [];

exports.pushServer = pushServerFn;
exports.popServer = popServerFn;
exports.getChunk = getChunkFn;
exports.setChunk = setChunkFn;

function pushServerFn(server) {
    chunkServer.push(server);
}

function popServerFn(server) {
    chunkServer.splice(chunkServer.indexOf(server), 1);
}

function getChunkFn() {
    return chunkServer;
}

function setChunkFn(chunks) {
    chunkServer = chunks;
}
