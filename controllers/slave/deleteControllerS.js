var util = require('util');
var fs=require('fs');
var chunkList = require('../../model/chunkList');
var mkdirp = require('mkdirp');
var slaveTable = require('../../model/slave/slaveTable');

exports.removeChunk = removeChunkFn;

/**
 * Questa funzione permette ad uno slave di rimuovere un file dal proprio file system
 * @param req
 * @param res
 */
function removeChunkFn(req, res) {

    if(req.body.type==='REMOVE_CHUNK')
    {
        slaveTable.removeByGuid(req.body.chunkGuid);

        fs.unlink(req.body.path, function(error) {
            if (error) {
                console.log(error);
            }
            console.log(req.body.chunkGuid+" deleted!");

        });
        res.send({type: 'REMOVED_CHUNK'});
    }
}