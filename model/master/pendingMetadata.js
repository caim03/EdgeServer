/**
 * Created by Debora on 24/10/17.
 */

var loki = require('lokijs');

var lokiDb = new loki();

exports.addFileMetadata = addFileMetadataFn;
exports.checkIfPending = checkIfPendingFn;
exports.printTable = printTableFn;
exports.removeMetaD = removeMetaDFn;

var pendingMetadataTable = lokiDb.addCollection('pendingMetadataTable');

function addFileMetadataFn(chunkGuid, name, relPath, extension, size, idUser, lastModified)
{
    var foundGuid_User = pendingMetadataTable.findObject({'chunkguid': chunkGuid, 'idUser': idUser});
    if(!foundGuid_User) {
        pendingMetadataTable.insert({'chunkguid': chunkGuid, 'name': name, 'relPath': relPath, 'extension': extension, 'size': size, 'idUser': idUser, 'lastModified': lastModified});
        //     console.log(".....AGGIUNTO IN TABELLA.....");
    }
    else console.log(chunkGuid+"-"+idUser+" già presente tra le richieste pendenti.");
}

function checkIfPendingFn(chunkGuid, idUser) {

    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingMetadataTable.findObject(obj);
//    console.log("CHECK IF PENDING.");
//    console.log(foundGuid_User.name+"   "+foundGuid_User.lastModified+"   "+foundGuid_User.extension+"   "+foundGuid_User.size+"   "+foundGuid_User.idUser+"   "+foundGuid_User.idUser+"   "+foundGuid_User.absPath);
    return foundGuid_User;
}


function printTableFn()
{
    pendingMetadataTable.chain().data().forEach(function (table) {
        console.log(table)
    });
}

function removeMetaDFn(chunkGuid, idUser) {
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingMetadataTable.findObject(obj);
    if(foundGuid_User)
    {
        pendingMetadataTable.chain().find(obj).remove();
    }
/*    else {
        console.log("Error: ("+chunkGuid+" - "+idUser+") not found in pending metadata.\n");
    }*/
}