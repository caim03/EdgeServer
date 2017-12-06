/**
 * Created by simone on 29/10/17.
 */
var loki = require('lokijs');

var lokiDb = new loki();

var slaveTable = lokiDb.addCollection('slaveTable');

exports.insertChunk = insertChunkFn;
exports.getAllChunk = getAllChunkFn;
exports.getChunk= getChunkFn;
exports.printTable = printTableFn;
exports.removeByGuid = removeByGuidFn;

function removeByGuidFn(chunkGuid)
{
    var obj = {'chunkGuid': chunkGuid};
    var foundChunk= slaveTable.findOne(obj);
    if(foundChunk)
    {
        slaveTable.chain().find(obj).remove();
    }
    else console.log("Guid not found");
}


function insertChunkFn(chunkguid, metadata, userId)
{
    slaveTable.insert({chunkGuid: chunkguid , metadata: metadata, userId: userId});
}

function getAllChunkFn()
{
    return slaveTable.chain().data();
}

function printTableFn() {

       slaveTable.chain().data().forEach(function (table) {
            console.log(table)
        });
}

function getChunkFn(chunkGuid) {
    var obj = {'chunkGuid': chunkGuid};
    var foundChunk= slaveTable.findOne(obj);
    console.log("foundChunk: "+foundChunk);
    return foundChunk;
}