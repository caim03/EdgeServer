var dynamoController = require("../../controllers/dynamoController");
exports.createTable = createTableFn;
exports.addItem = addItemFn;
exports.isEmptyObject = isEmptyObjectFn;
exports.getMetadataFromDynamo = getMetadataFromDynamoFn;
exports.deleteMetadataFromDynamo = deleteMetadataFromDynamoFn;

var ddb = dynamoController.getDynamoDb();
var masterTable = require('../../model/masterTableDb');

/**
 * Questa funzione permette di creare la masterTable su DynamoDB
 */
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

/**
 * Questa funzione permette di inserire un oggetto su DynamoDB
 * @param idUser
 * @param guid
 * @param metadata
 */
function addItemFn(idUser, guid, metadata)
{
    var docClient = dynamoController.getDynamoDocumentClient();
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
        }
        // else {
        //     console.log(data); // successful response
        // }
    });
}

/**
 * Questa funzione permette di ottenere i metadatti salavati su DynamoDB
 * @param idUser
 * @param callback
 */
function getMetadataFromDynamoFn(idUser, callback)
{
    var docClient = dynamoController.getDynamoDocumentClient();

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
            }
            else
            {
                data.Items.forEach(function(item) {
                    console.log("Found in dynamo: ", item.idUser + ": " + item.metadata.name+", "+item.metadata.relPath+", "+item.metadata.size+", "+item.metadata.extension+", "+item.metadata.lastModified);
                    masterTable.addChunkRef(item.guid, item.metadata, '', item.idUser);
                });
                callback(true);
            }
        }
    });
}

/**
 * Questa funzione permette di verificare se un oggetto è vuoto
 * @param obj
 * @return {boolean}
 */
function isEmptyObjectFn(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

/**
 * Questa funzione permette di eliminare dei metadati su DynamoDB
 * @param idUser
 * @param guid
 * @param callback
 */
function deleteMetadataFromDynamoFn(idUser, guid, callback)
{
    var docClient = dynamoController.getDynamoDocumentClient();
    var params = {
        TableName: 'MasterT',
        Key:{
            "idUser": idUser,
            "guid": guid
        }
    };
    console.log("Deleting "+idUser+" - "+guid);
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            callback(false);
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                callback(true);
        }
    });
}