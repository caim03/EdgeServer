/**
 * Created by Debora on 24/10/17.
 */

var loki = require('lokijs');

var lokiDb = new loki();

exports.addFileMetadata = addFileMetadataFn;
exports.checkIfPending = checkIfPendingFn;
exports.printTable = printTableFn;

var pendingMetadataTable = lokiDb.addCollection('pendingMetadataTable');

function addFileMetadataFn(chunkGuid, name, absPath, extension, size, idUser, lastModified)
{
    var foundGuid_User = pendingMetadataTable.findObject({'chunkguid': chunkGuid, 'idUser': idUser});
    if(!foundGuid_User) {
        pendingMetadataTable.insert({'chunkguid': chunkGuid, 'name': name, 'absPAth': absPath, 'extension': extension, 'size': size, 'idUser': idUser, 'lastModified': lastModified});
        //     console.log(".....AGGIUNTO IN TABELLA.....");
    }
    else console.log(chunkGuid+"-"+idUser+" già presente tra le richieste pendenti.");
}

function checkIfPendingFn(chunkGuid, idUser) {

    var pending = false;
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingMetadataTable.findObject(obj);

    if(foundGuid_User)
        pending = true;
    return pending;
}


function printTableFn()
{
    pendingMetadataTable.chain().data().forEach(function (table) {
        console.log(table)
    });

}

/*
fileName: chosenFileData.name,
    absPath: chosenFileData.absPath,
    extension: chosenFileData.extension,
    sizeFile: chosenFileData.sizeFile,
    idClient: chosenFileData.idClient,
    lastModified: chosenFileData.lastModified*/