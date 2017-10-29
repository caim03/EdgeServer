/**
 * Created by simone on 29/10/17.
 */
var loki = require('lokijs');

var lokiDb = new loki();

var slaveTable = lokiDb.addCollection('slaveTable');

exports.insertChunk = insertChunkFn;
exports.getAllChunk = getAllChunkFn;
function insertChunkFn(chunkguid, metadata, userId)
{

    slaveTable.insert({chunkGuid: chunkguid , metadata:metadata, userId : userId});
}

function getAllChunkFn()
{
    return slaveTable.chain().data();
}

function printTable() {

       slaveTable.chain().data().forEach(function (table) {
            console.log(table)
        });


}