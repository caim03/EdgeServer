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

function addSlaveListToGuidFn(chunkguid, slavesIp)
{
    var foundGuid = masterTable.findOne({'chunkguid': chunkguid});

    slavesIp.forEach(function (slaveIp) {
        foundGuid.slavesIp.push({
            slaveIp: slaveIp
        });
        masterTable.update(foundGuid);
        addSlaveOccupation(slaveIp);
    })

    foundGuid.cloud = true;
    masterTable.update(foundGuid);
}

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

function removeSlaveOccupationFn(slaveIp) {
    totalChunk--;
    ipOccupation.forEach(function (table) {
        if(table.slaveIp === slaveIp) {
            table.occupation--;
        }
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
        return {'slavesIp' :foundGuid.slavesIp,
                'metadata' : foundGuid.metadataTable};
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

function setCloudToGuidsFn(guids,cloud)
{

    guids.forEach(function (guid) {

    var foundGuid = masterTable.findOne({'chunkguid': guid});

    foundGuid.cloud = cloud;

    masterTable.update(foundGuid);
    })

}

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
