
var masterTable = [];
var ipOccupation = [];
var totalChunk = 0;
exports.addChunkRef = addChunkRefFn;
exports.removeChunkRef = removeChunkRefByGuidFn;
exports.getTable = getTableFn;
exports.guidGenerator = guidGeneratorFn;
exports.printTable = printTableFn;
exports.masterTableOccupation = masterTableOccupationFn;
exports.cleanTable = cleanTableFn;
exports.checkGuid = checkGuidFn;
exports.getAllChunksBySlave = getAllChunksBySlaveFn;

function addChunkRefFn(chunkGuid, slaveIp)
{

    var found = false;
    masterTable.forEach(function (table) {
        if(table.chunkguid === chunkGuid) {
            table.slavesIp.push({
                slaveIp: slaveIp
            })
            found = true;
        }
    });
    if(!found)
    {
        var slavesIp = [];

        slavesIp.push({
            slaveIp : slaveIp
        });


        masterTable.push({
            chunkguid: chunkGuid,
            slavesIp: slavesIp
        });
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

function removeByKeyFn(array, params){
    array.some(function(item, index) {
        return (array[index][params.key] === params.value) ? !!(array.splice(index, 1)) : false;
    });
    return array;
}

function removeChunkRefByGuidFn(chunkGuid)
{
   removeByKeyFn(masterTable, {
        key: 'chunkGuid',
        value: chunkGuid
    });
}

function getTableFn()
{

    return masterTable;
}

function guidGeneratorFn() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function printTableFn()
{
    masterTable.forEach(function (table) {
        console.log("---------------------------");
        console.log(table.chunkguid);
        console.log(table.slavesIp);
        console.log("---------------------------\n");
    })

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


    console.log(percentOccupation + "\n");
    return percentOccupation;
}

function cleanTableFn(){
    masterTable = [];
}

function checkGuidFn(IpServer, guid)
{
    var found = false;
    masterTable.forEach(function (table) {

        if(table.chunkguid === guid)
            table.slavesIp.forEach(function (slave) {
                if(slave.slaveIp === IpServer)
                    found = true;
            })
    });
    return found;
}

function getAllChunksBySlaveFn(IpServer)
{
    var chunkguids = [];
    masterTable.forEach(function (table){
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