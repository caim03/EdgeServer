/**
 * Created by Caim03 on 12/09/17.
 */
var chunkList = require('../../model/chunkList');
var slaveTable = require('../../model/slave/slaveTable');
var fs = require('fs');

/* Export delle funzionalità del chunkController */

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;
exports.getAllChunkData = getAllChunkDataFn;
exports.sendAckToMaster = sendAckToMasterFn;


/**
 * Questa funzione permette ad uno slave di leggere il contenuto di un file ed inviarlo al client
 * @param req
 * @param res
 */
function readFileFn(req, res) {
    console.log("Reading file...");
    var metadata = req.body;
    fs.createReadStream(metadata.path).pipe(res);
}


/**
 * Questa funzione permette al chunk server di ottenere tutti i chunk nella slaveTable ed inviarli.
 *
 * @param req
 * @param res
 * @return null
 * */
function getAllChunkDataFn(req, res){

    res.send(slaveTable.getAllChunk());
}

/**
 * Questa funzione ritorna un messaggio di ack al master a seguito della ricezione di un guid
 * @param req
 * @param res
 */
function sendAckToMasterFn(req, res)
{

    console.log("il server "+req.body.ipServer+" ha ricevuto il guid "+req.body.guid);


    var chunkMetaData = {};

    chunkMetaData.dim = 50;
    chunkMetaData.guid= req.body.guid;
    chunkMetaData.location = req.body.location;
    chunkList.pushChunk(chunkMetaData);

    var obj = {
        type: "ACK",
        guid: req.body.guid,
        ipServer: req.body.ipServer
    };

    res.send(obj);
}