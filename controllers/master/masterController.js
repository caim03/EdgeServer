var chunkServer = require('../../model/chunkServer');
var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');
var ip = require("ip");
var chunkList = require('../../model/chunkList');
var syncRequest = require('sync-request');


//var drawTable = require('console.table');

/* Export delle funzionalità del masterServer */

exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;
exports.subscribe = subscribeFn;
exports.subscribeToBalancer = subscribeToBalancerFn;
exports.heartbeatMessage = heartbeatMessageFn;
exports.newMasterRebalancment = newMasterRebalancmentFn;
exports.crushedSlaveRebalancment = crushedSlaveRebalancmentFn;
exports.sendChunkGuidToSlaves = sendChunkGuidToSlavesFn;
exports.addChunkGuidInTable = addChunkGuidInTableFn;
exports.buildSlaveList = buildSlavesListFn;


/* TODO Read File Meatadata */
function readFileFn(req, res) {
    res.send("HTTP GET");
}

/* TODO Write File Metadata */
function writeFileFn(req, res) {
    res.send("HTTP POST");
}

/* TODO Delete File Metadata */
function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

/* TODO Update File Metadata */
function updateFileFn(req, res) {
    res.send("HTTP PUT");
}

/* Questa funzione permette ad un chunkServer di sottoscriversi al master tramite una chiamata POST */
function subscribeFn(req, res) {
    console.log("SUBSCRIBE");
    var serverObj = {};
    var found = false;
    var len = chunkServer.getChunk().length;

    if (len === 0) {
        serverObj.id = 1;
    }
    else {
        serverObj.id = (chunkServer.getChunk())[len - 1].id + 1;
    }
    serverObj.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    serverObj.freeSpace = req.body.freeSpace;
    serverObj.alive = true;
    serverObj.ageingTime = config.ageingTime;

    chunkServer.getChunk().some(function (element) {
       if (element.ip === serverObj.ip){
           res.send({status: 'NACK'});
           found = true;
           return found;
       }
    });

    if (!found) {
        chunkServer.pushServer(serverObj);

        chunkServer.getChunk().forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/topology',
                method: 'POST',
                json: {chunkServers: chunkServer.getChunk(), yourId: server.id}
            };
            request(obj, function (err, res) {
                if (err){
                    console.log(err);
                    return;
                }
            })
        })
    }
    console.log(chunkServer.getChunk());
}



/* Questa funzione permette al master di sottoscriversi al load balancer */
function subscribeToBalancerFn(){
    var obj = {
        url: 'http://' + config.balancerIp + ':' + config.balancerPort + config.balancerSubPath,
        method: 'POST',
        json: {type: 'MASTER'}
    };

    console.log("Mi sto sottoscrivendo all'url "+obj.url);

    request(obj, function (err, res) {
        if(err) {
             console.log(err);
        }
    })
}


/* Questa funzione è adibita all'invio periodico dei messaggi di heartbeat ai chunkServer nella rete */
function heartbeatMessageFn() {
    /* setInterval(callback, timeout, [args...]) chiama la funzione di callback ogni timeout millisecondi */
    setInterval(function () {
        chunkServer.getChunk().forEach(function (server) {
            var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/heartbeat',
                method: 'POST',
                json: {type: "HEARTBEAT"},
                timeout: config.heartbeatTime/2
            };

            console.log("MANDO HB: " + server.ip);



            request(obj, function (err, res) {
                if (err) {
                    console.log("HEARTBEAT DI " + server.ip + " NON RICEVUTO");
                    console.log(err.code === 'ETIMEDOUT');
                    server.ageingTime--;

                    if (server.ageingTime === 0){
                        chunkServer.popServer(server);
                        console.log(server.ip + " CRUSHED");
                        crushedSlaveRebalancmentFn(server);
                    }
                }

                else{
                    server.freeSpace = res.body.freeSpace;
                    server.alive = true;
                    server.ageingTime = config.ageingTime;
                    console.log("HEARTBEAT DI " + server.ip + " RICEVUTO");
                    // console.log(server);
                }
            })
        })
    }, config.heartbeatTime);
}

/**
 *  Hey sono un nuovo master!
 *  1) Scrivo a tutti nella rete, e gli chiedo tutti i metadati dei chunk in loro possesso
 *  2) Aggiorno mano mano la tabella master
 *  3) Infine distribuisco i miei chunks a chi ha il carico minore
 *
 *  TODO NB LOCKARE STO PROCESSO + BUFFERIZZARE (Load Balancer?) le richieste fino a ribilanciamento completato
 */
function newMasterRebalancmentFn()
{
    // console.log("STARTING REBALANCMENT");
    masterTable.cleanTable();
    chunkServer.getChunk().forEach(function (server) {
        if(server.ip !== ip.address()) {
                var obj = {
                url: 'http://' + server.ip + ':' + config.port + '/api/chunk/metadata',
                method: 'GET'
            };

            var res = syncRequest('GET', obj.url);

            var receivedChunks = JSON.parse(res.getBody('utf8'));
            receivedChunks.forEach(function (chunk) {
                masterTable.addChunkRef(chunk.guid, server.ip);
            })
            }
        })

    //Per ogni elemento nella mia chunklist:
    //Creo la tabella di disponibilità ordinata della master table
    //Invio il chunk al primo della tabella che non abbia gia quel chunk
    var sended = false;
    var slaveServers = buildSlavesListFn(); //TODO Tabella fissata prima del ribilanciamento - si potrebbe aggiornarla mano mano ad ogni invio, ma ovviamente operazione + costosa
    chunkList.getChunkList().forEach(function (chunk) {
        sended = false;
        var guid = chunk.guid;
        slaveServers.forEach(function (server) {
            if(!sended)
                if(!masterTable.checkGuid(server,guid)) {
                    var obj = {
                        url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                        method: 'POST',
                        json: {
                            type: "CHUNK",
                            guid: guid,
                            ipServer: server
                        }
                    };

                    request(obj, function (err, res) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                    })
                    addChunkGuidInTableFn(server, guid);
                    //TODO Invio fisico del chunk!
                    sended = true;
                }
        })
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + guid);
    })
    chunkList.cleanList();
    // console.log("REBALANCMENT COMPLETED");

}


/**
 *  Dopo che uno slave crasha
 *
 *  1) Cerca tutti i chunk relativi a quello slave nella tabella
 *  2) Ribilancia quei chunk ad altri slave
 *  3) Aggiorna la tabella
 */
function crushedSlaveRebalancmentFn(slave)
{
    //Per ogni elemento nella chunklist di quello slave:
    //Creo la tabella di disponibilità ordinata della master table
    //Invio il chunk al primo della tabella che non abbia gia quel chunk


    var chunkGuids = masterTable.getAllChunksBySlave(slave.ip);
    masterTable.removeFromOccupationTable(slave.ip, chunkGuids);
    var slaveServers = buildSlavesListFn(); //TODO Tabella fissata prima del ribilanciamento - si potrebbe aggiornarla mano mano ad ogni invio, ma ovviamente operazione + costosa
    var sended = false;
    chunkGuids.forEach(function (chunks) {
        sended = false;
        var chunkguid = chunks.chunkguid;
        slaveServers.forEach(function (server) {
            if (!sended)
                if (!masterTable.checkGuid(server, chunkguid)) {
                    var obj = {
                        url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                        method: 'POST',
                        json: {
                            type: "CHUNK",
                            guid: chunkguid,
                            ipServer: server
                        }
                    };
                    request(obj, function (err, res) {
                        if (err) {
                            // console.log(err);
                            return;
                        }
                    });
                    addChunkGuidInTableFn(server, chunkguid);
                    //TODO Invio fisico del chunk! 2 OPZIONI: 1)Master manda (ip nuovo slave,guid) al vecchio slave che a sua volta invierà il file
                    sended = true;
                    //TODO pulire la masterTable dallo slave morto
                }

        });
        if(!sended)
            console.log("NON HO TROVATO VALIDI SLAVES PER " + chunkguid);
    })


}



/**
 *Il master invia il Chank GUID ricevuto dal client a replicationNumber server slaves.
 *Prima costruisce la lista di slaves (buildSlavesList)
 *Poi invia, ed aggiunge alla propria master table l'informazione.
 *
 */
//NON PIU' NECESSARIA. DA CANCELLARE.
function sendChunkGuidToSlavesFn(req, res)
{
    var slaveServers = buildSlavesListFn();
    // console.log("SLAVES SCELTI " + slaveServers);
    if(req.body.type == "CHUNK")
    {
        res.send({status: 'ACK'});
        slaveServers.forEach(function (server) {
            var obj = {
                url: 'http://' + server + ':' + config.port + '/api/chunk/sendToSlave',
                method: 'POST',
                json: {
                    type: "CHUNK",
                    guid: req.body.guid,
                    ipServer: server
                }
            };

            request(obj, function (err, res) {
                addChunkGuidInTableFn(server, res.body.guid);
                if (err){
                    // console.log(err);
                    return;
                }
             //TODO invio fisico del chunk 1) Il master o il client  -> post (slaveServers)
            })
        })
    }
}


/**
 *  Crea una lista di replicationNumber ip, che corrispondono agli slaves più vuoti:
 *  Come prima cosa inserisce nella lista gli slaves completamente vuoti(nuovi arrivati),
 *  in seguito ci aggiunge gli slaves ordinati per occupazione nella tabella
 *
 */
function buildSlavesListFn() {

    var slaveList = [];

    var numberOfSlaves = config.replicationNumber;

    var ipOccupation = masterTable.masterTableOccupation();

    console.log(ipOccupation);

    chunkServer.getChunk().forEach(function (server) {

        var found = false;

        ipOccupation.forEach(function (table) {
            if(server.ip === table.slaveIp)
                found= true;
        });

        if(!found && numberOfSlaves>0)
        {
            slaveList.push(server.ip);
            numberOfSlaves--;
        }
    });

    //Si gira comunque tutta la tabella quando in realtà sarebbe corretto fermare il ciclo una volta completata la slaveList
    //ma, non si può uscire bruscamente da un forEach, e con il for sembra non funzionare.
    if(numberOfSlaves>0)
        ipOccupation.forEach(function (table) {
           if(numberOfSlaves>0) {
               slaveList.push(table.slaveIp);
               numberOfSlaves--;
           }
        });

    return slaveList;
}


//Aggiunge in tabella il chank guid e l'ip dello slave che lo possiede.
function addChunkGuidInTableFn(slaveIp, chankGuid)
{
    masterTable.addChunkRef(chankGuid, slaveIp);    //add idClient
    masterTable.printTable();
}