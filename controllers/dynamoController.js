var dynamoConfiguration = require("../config/dynamoConfiguration");
var AWS = require("aws-sdk");


exports.setDynamoAccess = setDynamoAccessFn;
exports.getDynamoDocumentClient = getDynamoDocumentClientFn;
exports.getDynamoDb = getDynamoDbFn;

/**
 * Questa funzione permette di configurare l'accesso a DynamoDB, ottenendo le informazioni dal file di configurazione
 */
function setDynamoAccessFn() {
    AWS.config = new AWS.Config();
    AWS.config.accessKeyId = dynamoConfiguration.accessKeyID;
    AWS.config.secretAccessKey = dynamoConfiguration.secretAccessKeyId;
    AWS.config.region = dynamoConfiguration.region;
    AWS.config.endpoint = dynamoConfiguration.endpoint;

}

/**
 * Questa funzione permette effettuare una richiesta a Dynamo per l'accesso agli utenti
 * @return DocumentClient
 */
function getDynamoDocumentClientFn()
{
    return new AWS.DynamoDB.DocumentClient();
}

/**
 * Questa funzione permette di ottenere l'intero database di DynamoDB
 * @return DynamoDB
 */
function getDynamoDbFn(){

    return new AWS.DynamoDB();

}