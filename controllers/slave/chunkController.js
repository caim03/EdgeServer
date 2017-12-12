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


/* TODO Funzione adibita alla lettura di un chunk */
function readFileFn(req, res) {
    console.log("Reading file...");
    var metadata = req.body;
    fs.createReadStream(metadata.path).pipe(res);
}

/* TODO Funzione adibita alla scrittura di un chunk */
function writeFileFn(req, res) {

    var chunkMetaData = {};

    chunkMetaData.dim = req.body.dim;
    chunkMetaData.id = req.body.id;
    chunkMetaData.location = req.body.location;

    chunkList.pushChunk(chunkMetaData);

    res.send("OK");

    //TODO salva il chunk

}

/* TODO Funzione adibita alla cancellazione di un chunk */
function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

/* TODO Funzione adibita all'aggiornamento di un chunk */
function updateFileFn(req, res) {
    res.send("HTTP PUT");
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


//NON PIU' NECESSARIA???????
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