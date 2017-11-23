var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var masterTable = require('../../model/masterTableDb');
var pendingReq = require('../../model/slave/pendingRequests');
var process = require('process');
var fse = require('fs-extra');
var ip = require('ip');
var fs=require('fs');
var path = require("path");


exports.getAllMetadata = getAllMetadataFn;
exports.checkIfFound = checkIfFoundFn;
exports.createDirectoryTree = createDirectoryTreeFn;
exports.prettyJSONFn = prettyJSONFn;


/**
 * Questa funzione permette al master di accedere a tutti i metadati memorizzati nella tabella, effettuando la
 * ricerca in base all'utente che effettua la richiesta.
 *
 * @param user
 * @return tree
 */
function getAllMetadataFn(user) {
    var matchTables = masterTable.getAllMetadataByUser(user);
    var tree = createDirectoryTreeFn(matchTables);
    return tree;
}

/**
 * // TODO commentare la funzione
 *
 * @param name
 * @param arr
 * @return foundPos
 * */
function checkIfFoundFn(name, arr) {
    var foundPos = -1;
    var i;
    for(i=0; i<arr.length; i++)
    {
        if(arr[i].name === name)
        {
            foundPos = i;
            break;
        }
    }
    return foundPos;
}


/**
 * Questa funzione permette la master di creare l'albero di directory di un determinato utente.
 *
 * @param matchedMetadata
 * @return tree
 */
function createDirectoryTreeFn(matchedMetadata) {
    var tree = [];//[{name: 'Files', folder: true, children:[{name:'provaFile', folder: true, children: []}]}];
//    console.log("Tree dim: "+tree.length);
    var parsedPath = {};
    var i;
    var foundPos;
    var current = [];

    matchedMetadata.forEach(function (table) {
     //   console.log("Path for Debora: "+table.metadataTable.relPath);
        parsedPath = path.parse(table.metadataTable.relPath);
        current = tree;
        var arr = parsedPath.dir.split('/');
        for(i=0; i<arr.length; i++)
        {
            foundPos = checkIfFoundFn(arr[i], current);
            if(foundPos !== -1)
            {
//                console.log("Ho trovato "+arr[i]);
                if(i===(arr.length-1))
                {
//                    console.log(arr[i]+" è l'ultima cartella.");
                    current[foundPos].children.push({folder: false, name: table.metadataTable.name, size: table.metadataTable.size, extension: table.metadataTable.extension, lastModified: table.metadataTable.lastModified});
                 //   break;
                }
                else{
//                    console.log(arr[i]+" NON è l'ultima cartella.");
                    current = current[foundPos].children;
                }
            }
            else{
//                console.log("Non ho trovato "+arr[i]);
                if(i===(arr.length-1))
                {
//                    console.log(arr[i]+" è l'ultima cartella prima del file.");
                    current.push({folder: true, name:arr[i], children: [{folder: false, name: table.metadataTable.name, size: table.metadataTable.size, extension: table.metadataTable.extension, lastModified:table.metadataTable.lastModified}]});
                }
                else{
//                    console.log(arr[i]+" NON è l'ultima cartella prima del file.");
                    current.push({folder: true, name:arr[i], children: []});
                    current = current[current.length-1].children;
                }
            }
        }
    });
    return tree;
}

/**
 * Questa funzione ha lo scopo di rendere unmanamente leggibile un oggetto json.
 *
 * @param obj
 * @return null
 */
function prettyJSONFn(obj) {
    console.log(JSON.stringify(obj, null, 2));
}