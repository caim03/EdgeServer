/**
 * Created by simone on 19/10/17.
 */
var loki = require('lokijs');

var lokiDb = new loki();

var masterTable = lokiDb.addCollection('masterTable');
var metadataTable = lokiDb.addCollection('metadataTable');
var chunkServer = require('../model/chunkServer');
var dynamoTable = require('../model/master/dynamoTable');
var ipOccupation = [];
var totalChunk = 0;

exports.addChunkRef = addChunkRefFn;
exports.guidGenerator = guidGeneratorFn;
exports.printTable = printTableFn;
exports.masterTableOccupation = masterTableOccupationFn;
exports.cleanTable = cleanTableFn;
exports.checkGuid = checkGuidFn;
exports.getAllChunksBySlave = getAllChunksBySlaveFn;
exports.removeFromOccupationTable = removeFromOccupationTableFn;
exports.getTable = getTableFn;
exports.getAllMetadataByUser = getAllMetadataByUserFn;
exports.getOneSlaveByGuid = getOneSlaveByGuidFn;
exports.getAllSlavesByGuid = getAllSlavesByGuidFn;
exports.getFileByUserAndRelPath = getFileByUserAndRelPathFn;
exports.removeByGuid = removeByGuidFn;
exports.removeSlaveOccupation = removeSlaveOccupationFn;
exports.createBackupList = createBackupListFn;
exports.setCloudToGuids = setCloudToGuidsFn;
exports.addSlaveListToGuid = addSlaveListToGuidFn;
exports.saveMasterTableOnDynamo = saveMasterTableOnDynamoFn;

/**
 * Questa funzione rimuove un metadato di un file dal database usando come chiave il suo guid
 * @param chunkGuid
 */
function removeByGuidFn(chunkGuid)
{
    var obj = {'chunkguid': chunkGuid};
    var foundChunk= masterTable.findOne(obj);
    if(foundChunk)
    {
        masterTable.chain().find(obj).remove();
    }
    else console.log("Guid not found");
}

/**
 * Questa funzione permette di aggiungere un nuovo oggetto nel database. Tale oggetto contiene:
 *  - guid del file;
 *  - i metadati del file;
 *  - la lista degli slave che possiedono il file
 *  - l'id user dell'utente proprietario
 *  - un booleano 'cloud' ad indicare se il file è salvato in S3
 *
 * @param chunkGuid
 * @param metadata
 * @param slaveIp
 * @param idUser
 * @param cloud
 */
function addChunkRefFn(chunkGuid, metadata, slaveIp, idUser,cloud)
{
    var foundGuid = masterTable.findOne({'chunkguid': chunkGuid});

    if(!foundGuid)
    {
        var slavesIp = [];
        var usersId = [];

        if(slaveIp !== '') {
            slavesIp.push({
                slaveIp: slaveIp
            });
        }

        usersId.push({
            userId: idUser
        });


        masterTable.insert({chunkguid: chunkGuid , metadataTable: metadata, slavesIp: slavesIp , usersId : usersId, cloud: cloud});

    }
    else
    {
        if(slaveIp !== '')
        {
            foundGuid.slavesIp.push({
                slaveIp: slaveIp
            });
        }


        if(foundGuid.usersId.indexOf({usersId : idUser})!==-1)
            foundGuid.usersId.push({
                userId: idUser
            });
        masterTable.update(foundGuid);
    }
    if(slaveIp !== '')
        addSlaveOccupation(slaveIp);
}

/**
 * Questa funzione permette di aggiornare la lista degli slave che possiedono un determinato guid
 * @param chunkguid
 * @param slavesIp
 */
function addSlaveListToGuidFn(chunkguid, slavesIp)
{
    var foundGuid = masterTable.findOne({'chunkguid': chunkguid});

    slavesIp.forEach(function (slaveIp) {
        foundGuid.slavesIp.push({
            slaveIp: slaveIp
        });
        masterTable.update(foundGuid);
        addSlaveOccupation(slaveIp);
    });

    foundGuid.cloud = true;
    masterTable.update(foundGuid);
}

/**
 *
 * @param slaveIp
 */
function addSlaveOccupation(slaveIp)
{
    totalChunk++;
    var found = false;
    ipOccupation.forEach(function (table) {
        if(table.slaveIp === slaveIp) {
            table.occupation++;
            found = true;
        }
    });

    if(!found)
        ipOccupation.push({
            slaveIp: slaveIp,
            occupation: 1
        });



}
/**
 *
 * @param slaveIp
 */
function removeSlaveOccupationFn(slaveIp) {
    totalChunk--;
    ipOccupation.forEach(function (table) {
        if(table.slaveIp === slaveIp) {
            table.occupation--;
        }
    });
}

/**
 * Questa funzione permette di generare un nuovo guid in modo randomico
 * @return {string}
 */
function guidGeneratorFn() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/**
 * Questa funzione permette di mostrare in output la tabella
 */
function printTableFn()
{
    console.log("-----");
    masterTable.chain().data().forEach(function (table) {
        console.log(table)
    });
    console.log("-----");

    console.log(masterTableOccupationFn());
}

/**
 * Calcola la percentuale di occupazione della tabella per ogni slave
 * @returns {Array}
 */
function masterTableOccupationFn() {

    var percentOccupation = [];
    ipOccupation.forEach(function (table) {
        percentOccupation.push({
            slaveIp: table.slaveIp,
            occupation : table.occupation/totalChunk
        })
    });

    percentOccupation.sort(function(a, b) {
        return parseFloat(a.occupation) - parseFloat(b.occupation);
    });

    return percentOccupation;
}

/**
 * Questa funzione permette di pulire l'intera tabella
 */
function cleanTableFn(){

    masterTable.removeDataOnly();

}

/**
 * Questa funzione permette di cercare un guid all'interno del database. Ritorna true se la ricerca ha esito positivo,
 * false altrimenti.
 * @param IpServer
 * @param guid
 * @return {boolean}
 */
function checkGuidFn(IpServer, guid)
{

    var found = false;
    var foundGuid = masterTable.findOne({'chunkguid': guid});


    if(foundGuid)
    {
        foundGuid.slavesIp.forEach(function (slave) {
            if(slave.slaveIp === IpServer)
                found=true;
        });
    }
    return found;
}


/**
 * Questa funzione permette di ottenere uno slave tra quelli che possiedono un determinato guid
 * @param guid
 * @return {*}
 */
function getOneSlaveByGuidFn(guid)
{
    var foundGuid = masterTable.findOne({'chunkguid': guid});
    if(foundGuid.slavesIp[0])
        return foundGuid.slavesIp[0].slaveIp;
    else
        return null;
}

/**
 * Questa funzione permette di ottenere la lista degli slave che possidono un determinato guid
 * @param guid
 * @return {*}
 */
function getAllSlavesByGuidFn(guid) {

    var foundGuid = masterTable.findOne({'chunkguid': guid});
    if (foundGuid.slavesIp) {
        return {'slavesIp' :foundGuid.slavesIp,
                'metadata' : foundGuid.metadataTable};
    }
    else {
        return null;
    }
}

/**
 * Permette di ottenere tutti i guid posseduto da uno specifico slave
 * @param IpServer
 * @return {Array}
 */
function getAllChunksBySlaveFn(IpServer)
{

    var chunkguids = [];
    masterTable.chain().data().forEach(function (table){
        var ips = table.slavesIp;
        ips.forEach(function (slave) {
            if (slave.slaveIp === IpServer)
                chunkguids.push({
                    chunkguid: table.chunkguid,
                    metadata: table.metadataTable,
                    usersId: table.usersId
                });
        });
    });

    return chunkguids;
}

/**
 *
 * @param slaveIp
 * @param chunkGuids
 */
function removeFromOccupationTableFn(slaveIp, chunkGuids)
{


    chunkGuids.forEach(function (guid) {


        var foundGuid = masterTable.findOne({'chunkguid': guid.chunkguid});

        var index;
        foundGuid.slavesIp.forEach(function (ip) {

            if(ip.slaveIp === slaveIp)
                index = foundGuid.slavesIp.indexOf(ip);

        });

        foundGuid.slavesIp.splice(index,1);
        masterTable.update(foundGuid);
    });

    ipOccupation.forEach(function (table) {
        if(table.slaveIp === slaveIp) {
            totalChunk -= table.occupation;
            ipOccupation.splice(ipOccupation.indexOf(table), 1);
        }
    });

}

/**
 * Questa funzione restituisce l'intera master table
 * @return {*}
 */
function getTableFn() {
    return masterTable;
}

/**
 * Questa funzione permette di ottenere tutti i metadati dei file posseduti da un determinato utente
 * @param userId
 * @return {Array}
 */
function getAllMetadataByUserFn(userId) {

    var matchedTables = [];

    masterTable.chain().data().forEach(function (table){

        var users = table.usersId;
        users.forEach(function (idUser){
            if(idUser.userId === userId)
            {
                matchedTables.push({
                    metadata: table.metadataTable,
                    guid: table.chunkguid
                });
            }
        });
    });

    return matchedTables;
}

/**
 * Questa funzione permette di ottenere il guid e la lista degli slave che possiedono il file relativo al guid
 * utilizzando come chiave (id utente, path del file).
 * @param userId
 * @param relPath
 * @return {{}}
 */
function getFileByUserAndRelPathFn(userId, relPath) {
    var matchedTable = {};

    masterTable.chain().data().forEach(function (table){

        var users = table.usersId;
        users.forEach(function (idUser){
            if(idUser.userId === userId)
            {
                //trovo relPath nella master table
                if(table.metadataTable.relPath === relPath) {
                    matchedTable = {
                        guid: table.chunkguid,
                        slavesIp: table.slavesIp
                    };
                }
            }
        });
    });
    return matchedTable;
}

/**
 * Questa funzione permette di generare la lista degli slave per inizializzare la fase di backup
 * @return {Array}
 */
function createBackupListFn()
{

    var backupList = [];

    chunkServer.getChunk().forEach(function (slave) {
        backupList.push({
            slaveIp: slave.ip,
            guidToBackup: []
        })
    });

    var guidToBackup = masterTable.find({'cloud': false});

    guidToBackup.forEach(function (table) {

        if(table.slavesIp.length !== 0) {
            //Prende un unico slave che deve backuppare il chunk
            var slaveBackupper = slaveChoise(table.slavesIp);

            //Nella backupList
            backupList.forEach(function (list) {
                if (slaveBackupper === list.slaveIp)
                    list.guidToBackup.push(table.chunkguid);
            });
        }
        });


    return backupList;

}

/*

Sceglie uno slave tra la lista che deve effettuare il backup di UN CHUNK

METRICA: CASUALE
 */
function slaveChoise(slavesIp)
{

    return slavesIp[Math.floor(Math.random()*slavesIp.length)].slaveIp;

}

/**
 * Questa funzione permette di aggiornare lo stato di un guid, in caso sia stato inserito in s3 o tolto da s3.
 * @param guids
 * @param cloud
 */
function setCloudToGuidsFn(guids,cloud)
{

    guids.forEach(function (guid) {

    var foundGuid = masterTable.findOne({'chunkguid': guid});

    foundGuid.cloud = cloud;

    masterTable.update(foundGuid);
    })

}

/**
 * Questa funzione permette di salvare la master table sul database
 */
function saveMasterTableOnDynamoFn()
{
    masterTable.chain().data().forEach(function (table){
        if(table.cloud === false) {
            var users = table.usersId;
            users.forEach(function (idUser) {

                dynamoTable.addItem(idUser.userId, table.chunkguid, table.metadataTable);
            });
        }
    });
}
