
var masterTable = [];

exports.addChunkRef = addChunkRefFn;
exports.removeChunkRef = removeChunkRefByGuidFn;
exports.getTable = getTableFn;
exports.guidGenerator = guidGeneratorFn;
exports.printTable = printTableFn;
exports.masterTableOccupation = masterTableOccupationFn;
exports.cleanTable = cleanTableFn;
exports.checkGuid = checkGuidFn;

function addChunkRefFn(chunkGuid, slaveIp)
{

    var found = false;
    masterTable.forEach(function (table) {
            if(table.slaveIp === slaveIp) {
                table.chunkGuids.push({
                    chunkguid: chunkGuid
                })
                found = true;
            }
        })

    if(!found)
    {
        var chunkGuids = [];
        chunkGuids.push({
            chunkguid : chunkGuid
        })

        masterTable.push({
            chunkGuids: chunkGuids,
            slaveIp: slaveIp
        });

    }
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
        console.log(table.slaveIp);
        console.log(table.chunkGuids);
        console.log("---------------------------\n");
    })

}


/**
 * Calcola la percentuale di occupazione della tabella per ogni slave
 * @returns {Array}
 */
function masterTableOccupationFn() {

    var ipOccupation = [];

    var tot = 0;

    masterTable.forEach(function (table) {
        tot+= table.chunkGuids.length;
    });

    masterTable.forEach(function (table) {
        ipOccupation.push({
            slaveIp: table.slaveIp,
            occupation : table.chunkGuids.length/tot
        })
    });

    ipOccupation.sort(function(a, b) {
        return parseFloat(a.occupation) - parseFloat(b.occupation);
    });


    console.log(ipOccupation + "\n");
    return ipOccupation;
}

function cleanTableFn(){
    masterTable = [];
}

function checkGuidFn(IpServer, guid)
{
    var found = false;
    masterTable.forEach(function (table) {

        if(IpServer === table.slaveIp)
            table.chunkGuids.forEach(function (chunk){
                if(chunk.chunkguid === guid)
                     found = true;
            })
    });

    return found;
}
