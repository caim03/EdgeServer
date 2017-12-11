var dynamoConfiguration = require("../config/dynamoConfiguration");
var AWS = require("aws-sdk");


exports.setDynamoAccess = setDynamoAccessFn;
exports.getDynamoDocumentClient = getDynamoDocumentClientFn;
exports.getDynamoDb = getDynamoDbFn;


function setDynamoAccessFn() {
    AWS.config = new AWS.Config();
    AWS.config.accessKeyId = dynamoConfiguration.accessKeyID;
    AWS.config.secretAccessKey = dynamoConfiguration.secretAccessKeyId;
    AWS.config.region = dynamoConfiguration.region;
    AWS.config.endpoint = dynamoConfiguration.endpoint;

}

function getDynamoDocumentClientFn()
{
    return new AWS.DynamoDB.DocumentClient();
}

function getDynamoDbFn(){

    return new AWS.DynamoDB();

}