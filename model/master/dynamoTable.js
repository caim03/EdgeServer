var AWS = require("aws-sdk");

exports.createTable = createTableFn;
exports.addItem = addItemFn;
exports.isEmptyObject = isEmptyObjectFn;
exports.getMetadataFromDynamo = getMetadataFromDynamoFn;

AWS.config.update({
    region: "us-east-2",
    endpoint: "https://dynamodb.us-east-2.amazonaws.com"
});

var ddb = new AWS.DynamoDB();
var masterTable = require('../../model/masterTableDb');

function createTableFn()
{
    console.log("I'm creating table MasterT");
    var params = {
        TableName : 'MasterT',
        KeySchema: [
            {
                AttributeName: 'idUser',
                KeyType: "HASH" //Partition key
            },
            {
                AttributeName: 'guid',
                KeyType: 'RANGE'
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: 'idUser',
                AttributeType: "S"
            },
            {
                AttributeName: 'guid',
                AttributeType: "S"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    };

    ddb.createTable(params, function (err, data) {
        if (err) {
            console.error("Unable to create table: ", err.message);
        } else {
            console.log("Created table Master in DynamoDb"); //. Table description JSON:", JSON.stringify(data, null, 2));
        //    return;
        }
    });
}

function addItemFn(idUser, guid, metadata)
{
    var docClient = new AWS.DynamoDB.DocumentClient();
    console.log("Adding metadata for "+idUser+".");

    var params = {
        TableName: 'MasterT',
        Item: {
            "guid":  guid,
            "idUser": idUser,
            "metadata": {
                "name": metadata.name,
                "relPath": metadata.relPath,
                "size": metadata.size,
                "extension": metadata.extension,
                "lastModified": metadata.lastModified
            }
        }
    };
    docClient.put(params, function(err, data) {
        if (err){
            console.log(err); // an error occurred
        }else {
            console.log(data); // successful response
        }
    });
}

function getMetadataFromDynamoFn(idUser, callback)
{
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: "MasterT",
        KeyConditionExpression: "#id = :idU",
        ExpressionAttributeNames:{
            "#id": "idUser"
        },
        ExpressionAttributeValues: {
            ":idU": idUser
        }
    };
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            if(isEmptyObjectFn(data.Items)) {
                console.log("No match found");
                callback(false);
          //      masterTable.printTable();
            }
            else
            {
                data.Items.forEach(function(item) {
                    console.log(" -", item.idUser + ": " + item.metadata.name+", "+item.metadata.relPath+", "+item.metadata.size+", "+item.metadata.extension+", "+item.metadata.lastModified);
                    masterTable.addChunkRef(item.guid, item.metadata, '', item.idUser);
                    callback(true);
               //     masterTable.printTable();
                });
            }
        }
    });
}

function isEmptyObjectFn(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

//createTableFn();
//example adding item
/*
var metadata = {
    name: "prova2.txt",
    relPath: "Debora/Files/prova2.txt",
    size: '55',
    extension: '.txt',
    lastModified: "05/04/2018"
};
*/

//setTimeout(addItemFn,5000, "Deb", "aaaakkkk5555", metadata);
/*
getMetadataFromDynamoFn("Debora");
setTimeout(getMetadataFromDynamoFn, 5000, "Deb");
setTimeout(masterTable.printTable, 7000);
*/