var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var master = require('../../model/masterServer');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var masterController = require('../master/masterController');
var chunkList = require('../../model/chunkList');


var multiparty = require('multiparty');
var util = require('util');
var process = require('process');

var ip = require('ip');
var fs=require('fs');

var mkdirp = require('mkdirp');

const Writable = require('stream');

exports.saveFile = saveFileFn;
exports.savePendingRequest = savePendingRequest;

exports.uploadFile = uploadFileFn;

/**
 * Lo slave riceve una coppia (guid, ipClient) dal master.
 *
 * @param req
 * @param res
 */
function savePendingRequest(req, res) {
    //TODO Quando lo slave riceve (guid, ipClient) dal master, metti la richiesta in attesa in una tabella.

    console.log("Nuova richiesta arrivata dal master.");
}


/**
 * Lo slave riceve un file dal client.
 *
 * @param req
 * @param res
 */
function saveFileFn(req, res) {

    //TODO Fare match tra richieste pendenti in tabella e (guid, ipClient) ricevuti dal client.

    //TODO Se c'è corrispondenza, salva il file nello slave, elimina (guid, ipClient) dalle richieste pendenti e invia un ack al master (l'invio dell'ack è come nel codice seguente).

    console.log("FILE ARRIVATO: "+res);

    var obj = {
        type: "ACK",
        guid: req.body.guid,
        idClient: req.body.idClient,
        ipServer: ip.address()
    };

    res.send(obj);
    console.log("sono il server "+ip.address());
}


/**
 * This function upload files received from client
 *
 * @param req
 * @param res
 */
function uploadFileFn(req, res) {
    console.log("File uploading.");

//console.log("!!!!!"+req.write(data));

    var dataArr = [];

    var i = 0;

    //FUNZIONAAAAAAAAA

    var writeStream = new Writable();
    req.on('data', function (data) {

        dataArr.push(data);
        if(i==4)
        {
            if(!fs.existsSync(dataArr[1]))
                fs.mkdirSync(dataArr[1]);
            writeStream = fs.createWriteStream(dataArr[1]+'/'+dataArr[4]);
        }
        if(i==7)
            writeStream.write(dataArr[7]);
        i++;
    });
    req.on('end', function() {
        writeStream.end();
        res.statusCode = 200;
        res.end(dataArr[1]+'/'+dataArr[4]);
    });


    //TODO Slave invia al master GUID, ip dello slave stesso e idClient

    //TODO (NEL LATO MASTER) Il master salva in tabella quanto ricevuto e invia ack sia al server che al client (???Tipo avviso "File saved").
}