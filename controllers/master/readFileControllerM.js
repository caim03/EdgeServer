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

exports.prova = prova;
exports.checkIfFound = checkIfFoundFn;
exports.createDirectoryTree = createDirectoryTreeFn;

function dirTree(filename) {
    var stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}

function prova(user) {
    var matchTable = masterTable.getAllMetadataByUser(user);
    console.log("^^^^^^^^^^^^^^^^^^^^^^");
    console.log("GUID con Debora: ");
    matchTable.forEach(function (t) {

        console.log(t.metadataTable.absPath);
//                var arr = t.metadataTable.absPath.split('');
//                console.log(arr);
        console.log(path.parse(t.metadataTable.absPath));
    });
    console.log("^^^^^^^^^^^^^^^^^^^^^^");
}

var paths = [
    "Files/provaFile/file1.txt",
    "Files/file2.txt",
    "Files/prova2/file3.txt",
    "Files/provaFile/file3.txt"
];

function checkIfFoundFn(name, arr) {
    var foundedPos = -1;
    var i;
    console.log("Array "+arr.length);
    for(i=0; i<arr.length; i++)
    {
        if(arr[i].name === name)
        {
            foundedPos = i;
            break;
        }
    }
    return foundedPos;
}

var treeExample = {
    folder: false,
    name: '',
    size: '',
    extension: '',
    lastModified: '',
    children: []
};

function createDirectoryTreeFn(paths) {
    var tree = [];//[{name: 'Files', folder: true, children:[{name:'provaFile', folder: true, children: []}]}];
//    console.log("Tree dim: "+tree.length);
    var parsedPath = [];
    var i;
    var foundPos;
    var current = [];
    paths.forEach(function (t) {
        parsedPath.push(path.parse(t));
    });
    parsedPath.forEach(function (filePath) {
  //      console.log("Albero: "+tree);
        current = tree;
    //    current = JSON.parse(JSON.stringify(current));
    //    console.log("......"+current.name);
    //    console.log(filePath);
        var arr = filePath.dir.split('/');
        for(i=0; i<arr.length; i++)
        {
            console.log("i: "+i);
            foundPos = checkIfFoundFn(arr[i], current);
            console.log("foundPos: "+foundPos+"..."+arr[i]+"..."+current.length);
            if(foundPos !== -1)
            {
                console.log("Ho trovato "+arr[i]);
          //      console.log("Tree: "+tree);
                if(i===(arr.length-1))
                {
                    console.log(arr[i]+" è l'ultima cartella.");
                    current[foundPos].children.push({folder: false, name: filePath.base, size: '', extension: filePath.ext, lastModified: ''});
                 //   break;
                }
                else{
                    console.log(arr[i]+" NON è l'ultima cartella.");
                    current = current[foundPos].children;
                }
            }
            else{
                console.log("Non ho trovato "+arr[i]);
         //       console.log("Tree: "+tree);
                if(i===(arr.length-1))
                {
                    console.log(arr[i]+" è l'ultima cartella prima del file.");
                    current.push({folder: true, name:arr[i], children: [{folder: false, name: filePath.base, size: '', extension: filePath.ext, lastModified:''}]});
                }
                else{
                    console.log(arr[i]+" NON è l'ultima cartella prima del file.");
                    current.push({folder: true, name:arr[i], children: []});
              //      console.log("tree dopo push folder: "+current[0].name+"   "+current[1].name);
                    current = current[current.length-1].children;
               //     current = JSON.parse(JSON.stringify(current.children));
              //      console.log("Curr: "+current);
                }
            }
        }
    });
    return tree;
}


function prettyJSON(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

prettyJSON(createDirectoryTreeFn(paths));

/*paths.forEach(function (t) {
    console.log(path.parse(t));
});*/