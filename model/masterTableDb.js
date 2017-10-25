/**
 * Created by simone on 19/10/17.
 */
var loki = require('lokijs');

var lokiDb = new loki();

var userTable = lokiDb.addCollection('userTable');
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

exports.getAllMetadataByUser = getAllMetadataByUserFn;

exports.createMetadataTable = createMetadataTableFn;

function addChunkRefFn(chunkGuid, metadata, slaveIp, idUser)
{

    var foundGuid = masterTable.findOne({'chunkguid': chunkGuid});

    if(!foundGuid)
    {
        var slavesIp = [];

        slavesIp.push({
            slaveIp : slaveIp
        });

        masterTable.insert({chunkguid: chunkGuid , metadataTable: metadata, slavesIp: slavesIp , userTable : idUser});

    }
    else
    {
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


    // console.log(percentOccupation + "\n");
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

function getAllChunksBySlaveFn(IpServer)
{
    var chunkguids = [];
    masterTable.chain().data().forEach(function (table){
        var ips = table.slavesIp;
        ips.forEach(function (slave) {
            if (slave.slaveIp === IpServer)
                chunkguids.push({
                    chunkguid: table.chunkguid
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


    console.log(ipOccupation);

}


//TO COMPLETE
function getAllMetadataByUserFn(userId) {

    masterTable.chain().data().forEach(function (table){
        var obj = {'userId': userId};
        var foundUser = table.findObject(obj);

        if(foundUser)
        {

        }

        var metadataT = table.metadataTable;
        console.log("TABLE: "+metadataT);
    });
}

