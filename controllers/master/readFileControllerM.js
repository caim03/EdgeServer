var request = require('request');
var config = require('../../config/config');
var masterTable = require('../../model/masterTableDb');
var pendingReq = require('../../model/slave/pendingRequests');
var process = require('process');
//var fse = require('fs-extra');
var ip = require('ip');
var fs=require('fs');
var path = require("path");


exports.getAllMetadata = getAllMetadataFn;
exports.checkIfFound = checkIfFoundFn;
exports.createDirectoryTree = createDirectoryTreeFn;
exports.prettyJSONFn = prettyJSONFn;
exports.getReadSlaves = getReadSlavesFn;


/**
 * Questa funzione permette al master di accedere a tutti i metadati memorizzati nella tabella, effettuando la
 * ricerca in base all'utente che effettua la richiesta.
 *
 * @param req
 * @param res
 * @return null
 */
function getAllMetadataFn(req, res) {
    console.log("Tree requested by " + req.body.username);
    var matchTables = masterTable.getAllMetadataByUser(req.body.username);
    var tree = createDirectoryTreeFn(matchTables, req.body.username);
    res.status(200).send(tree);
    res.end();
}

/**
 * // Questa funzione permette di verificare l'esistenza di un elemento (file) dentro un array (directory tree)
 *
 * @param name
 * @param arr
 * @return foundPos
 */
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
 * @param username
 * @return tree
 */
function createDirectoryTreeFn(matchedMetadata, username) {
    var tree = [];//[{name: 'Files', folder: true, children:[{name:'provaFile', folder: true, children: []}]}];
//    console.log("Tree dim: "+tree.length);
    var parsedPath = {};
    var i;
    var foundPos;
    var current = [];

    var root = {
        name: username,
        folder: true,
        children: []
    };

    tree.push(root);

    matchedMetadata.forEach(function (table) {
     //   console.log("Path for Debora: "+table.metadataTable.relPath);
        console.log(table);
        parsedPath = path.parse(table.metadata.relPath);
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
                    current[foundPos].children.push({folder: false,
                        name: table.metadata.name,
                        size: table.metadata.size,
                        extension: table.metadata.extension,
                        lastModified: table.metadata.lastModified,
                        path: table.metadata.relPath,
                        guid: table.guid
                    });
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
                    current.push({folder: true, name:arr[i], children: [{folder: false, name: table.metadata.name, size: table.metadata.size, extension: table.metadata.extension, lastModified:table.metadata.lastModified}]});
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

function getReadSlavesFn(req, res) {
    var metadata = req.body;

    var slaves = masterTable.getAllSlavesByGuid(req.body.guid);
    res.send(slaves);
}