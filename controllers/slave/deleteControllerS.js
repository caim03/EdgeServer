var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var master = require('../../model/masterServer');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var masterController = require('../master/masterController');
var chunkList = require('../../model/chunkList');
var pendingReq = require('../../model/slave/pendingRequests');
var shell = require('shelljs');
var formidable = require('formidable');
var multiparty = require('multiparty');
var util = require('util');
var process = require('process');
var ip = require('../../model/ip');
var fs=require('fs');
var chunkList = require('../../model/chunkList');
var mkdirp = require('mkdirp');
var slaveTable = require('../../model/slave/slaveTable');
const Writable = require('stream');
var path = require("path");

exports.removeChunk = removeChunkFn;

function removeChunkFn(req, res) {

    if(req.body.type==='REMOVE_CHUNK')
    {
        slaveTable.removeByGuid(req.body.chunkGuid);

        fs.unlink(req.body.relPath);


        console.log(req.body.chunkGuid+" deleted!");

        res.send({type: 'REMOVED_CHUNK'});
    }
}