var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var master = require('../../model/masterServer');
var chunkServers = require('../../model/chunkServer');
var serverInfo = require('../../model/serverInfo');
var masterController = require('../master/masterController');
var chunkList = require('../../model/chunkList');
var pendingReq = require('../../model/slave/pendingRequests');

var formidable = require('formidable');

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

exports.checkIfPending = checkIfPendingFn;

/**
 * Lo slave riceve una coppia (guid, ipClient) dal master.
 *
 * @param req
 * @param res
 */
function savePendingRequest(req, res) {

    console.log("New authorization from master: "+req.body.guid+", "+req.body.idClient);

    if(req.body.type == "GUID_MASTER")
    {
        pendingReq.addNewReq(req.body.guid, req.body.idClient);
    }
}

function checkIfPendingFn(req, res) {

    if(pendingReq.checkIfPending(req.body.guid, req.body.idClient))
    {
        var obj = {
            type: "ACK",
            guid: req.body.guid,
            ipServer: ip.address()
        }
        res.send(obj);
    }
    else console.log("You have not been authorized by server to upload "+req.body.guid+" in "+ip.address());
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

/**/

function uploadFileFn(req, res) {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];

    form
        .on('field', function (field, value) {
            fields.push([field, value]);
        })
        .on('file', function (field, file) {
            files.push([field, file]);
        })
        .on('fileBegin', function (name, file) {
            if (!fs.existsSync(fields[1][1]))
                fs.mkdirSync(fields[1][1]);
            file.path = fields[1][1] + '/' + file.name;
            console.log(file.path);
        })
        .on('end', function () {
            console.log('-> upload done'+'\n');
            res.writeHead(200, {'content-type': 'text/plain'});
            res.statusCode = 200;
    });
    form.parse(req);
    req.on('end', function() {
        //    writeStream.end();
        res.statusCode = 200;
   //     res.end("file.txt");
    });


}





    //TODO Slave invia al master GUID, ip dello slave stesso e idClient

    //TODO (NEL LATO MASTER) Il master salva in tabella quanto ricevuto e invia ack sia al server che al client (???Tipo avviso "File saved").