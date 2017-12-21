/**
 * Created by Debora on 23/10/17.
 */

var loki = require('lokijs');

var lokiDb = new loki();

exports.addNewReq = addNewReqFn;
exports.removeReq = removeReqFn;
exports.checkIfPending = checkIfPendingFn;
exports.printTable = printTableFn;


var pendingReqTable = lokiDb.addCollection('pendingReqTable');

function addNewReqFn(chunkGuid, idUser)
{
    var foundGuid_User = pendingReqTable.findObject({'chunkguid': chunkGuid, 'idUser': idUser});
    if(!foundGuid_User) {
        pendingReqTable.insert({'chunkguid': chunkGuid, 'idUser': idUser});
    }
    else console.log(chunkGuid+"-"+idUser+" già presente tra le richieste pendenti.");
}


function removeReqFn(chunkGuid, idUser) {
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingReqTable.findObject(obj);
    if(foundGuid_User)
    {
        pendingReqTable.chain().find(obj).remove();
    }
}


function checkIfPendingFn(chunkGuid, idUser) {

    var pending = false;
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingReqTable.findObject(obj);

    if(foundGuid_User)
        pending = true;
    return pending;
}


function printTableFn()
{
    pendingReqTable.chain().data().forEach(function (table) {
        console.log(table)
    });

}