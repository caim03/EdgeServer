/**
 * Created by simone on 01/10/17.
 */
/*
Lista dei metadata dei chunk in possesso del relativo slave
 */
var chunkList = [];

exports.pushChunk = pushChunkFn;
exports.getChunkList = getChunkListFn;

function pushChunkFn(chunk) {
    chunkList.push(chunk);
}

function getChunkListFn() {
    return chunkList;
}

