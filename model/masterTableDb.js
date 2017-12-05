/**
 * Created by simone on 19/10/17.
 */
var loki = require('lokijs');

var lokiDb = new loki();

//var userTable = lokiDb.addCollection('userTable');
var masterTable = lokiDb.addCollection('masterTable');
var metadataTable = lokiDb.addCollection('metadataTable');
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


function addChunkRefFn(chunkGuid, metadata, slaveIp, idUser)
{
    var foundGuid = masterTable.findOne({'chunkguid': chunkGuid});

    if(!foundGuid)
    {
        var slavesIp = [];
        var usersId = [];

        slavesIp.push({
            slaveIp : slaveIp
        });

        usersId.push({
            userId: idUser
        });

        masterTable.insert({chunkguid: chunkGuid , metadataTable: metadata, slavesIp: slavesIp , usersId : usersId});

    }
    else
    {
        //TODO Controllare anche che l'idUser corrisponda? Dipende se facciamo la condivisione dei file tra più utenti.
        foundGuid.slavesIp.push({
            slaveIp: slaveIp
        });

        masterTable.update(foundGuid);
    }

    buildSlaveOccupation(slaveIp);
}

function buildSlaveOccupation(slaveIp)
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

function guidGeneratorFn() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function printTableFn()
{
    masterTable.chain().data().forEach(function (table) {
        console.log(table)
    });


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


function cleanTableFn(){

    masterTable.removeDataOnly();

}

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



function getOneSlaveByGuidFn(guid)
{
    var foundGuid = masterTable.findOne({'chunkguid': guid});
    if(foundGuid.slavesIp[0])
        return foundGuid.slavesIp[0].slaveIp;
    else
        return null;
}

function getAllSlavesByGuidFn(guid) {

    var foundGuid = masterTable.findOne({'chunkguid': guid});
    if (foundGuid.slavesIp) {
        return foundGuid.slavesIp;
    }
    else {
        return null;
    }
}

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

function getTableFn() {
    return masterTable;
}

function getAllMetadataByUserFn(userId) {

    var matchedTables = [];

    masterTable.chain().data().forEach(function (table){

//        console.log("FOR EACH: ***********");
//        console.log(table);

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

function getFileByUserAndRelPathFn(userId, relPath) {
    var matchedTable = {};

    masterTable.chain().data().forEach(function (table){

        var users = table.usersId;
        users.forEach(function (idUser){
            if(idUser.userId === userId)
            {
                //verifico relPath
                if(table.metadataTable.relPath === relPath) {
                    var temp = {
                        guid: table.chunkguid,
                        slavesIp: table.slavesIp
                    };
                    matchedTable = temp;
                }
            }
        });
    });

    return matchedTable;
}