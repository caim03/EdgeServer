
var masterTable = [];

exports.addChunkRef = addChunkRefFn;
exports.removeChunkRef = removeChunkRefByGuidFn;
exports.getTable = getTableFn;
exports.guidGenerator = guidGeneratorFn;

function addChunkRefFn(chunkGuid, slaveIp)
{
        masterTable.push({
        chunkGuid: chunkGuid,
        slaveIp: slaveIp
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