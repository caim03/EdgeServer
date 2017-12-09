var AWS = require("aws-sdk");

exports.createTable = createTableFn;
exports.addItem = addItemFn;

AWS.config.update({
    region: "us-east-2",
    endpoint: "https://dynamodb.us-east-2.amazonaws.com"
});

var ddb = new AWS.DynamoDB();

function createTableFn()
{
    console.log("I'm creating table Users");
    var params = {
        TableName : 'MasterT',
        KeySchema: [
            {
                AttributeName: 'guid',
                KeyType: "HASH" //Partition key
            },
            {
                AttributeName: 'idUser',
                KeyType: 'RANGE'
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: 'guid',
                AttributeType: "S"
            },
            {
                AttributeName: 'idUser',
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
            "idUser": idUser,
            "guid":  guid,
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



//createTableFn();
//example adding item
/*var metadata = {
    name: "prova.txt",
    relPath: "/Deb/prova.txt",
    size: '55',
    extension: '.txt',
    lastModified: "05/04/2018"
};

setTimeout(addItemFn,5000, "Debora", "hhhkkkk5555", metadata);*/