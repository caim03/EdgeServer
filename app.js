// This application uses express as its web server

var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config/config');
var topologyMasterController = require('./controllers/master/topologyController');
var topologySlaveController = require('./controllers/slave/topologyController');
var info = require('./model/serverInfo');
var ip = require('./model/ip');
var backupController = require('./controllers/master/backupControllerM');
var s3Controller = require('./controllers/s3Controller');
var ddb = require('./controllers/dynamoController');

exports.startMaster = startMasterFn;
exports.startSlave = startSlaveFn;

// create a new express server
var app = express();
app.use(bodyParser.json());
// app.use(express.json());
// app.use(express.urlencoded());
//serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

require('./routes/masterRoute')(app);
require('./routes/chunkRoute')(app);


ip.setAddress();
ip.getPrivateIp();




// start server on the specified port and binding host
app.listen(config.port, config.ip, function() {
  // print a message when the server starts listening
  console.log("server starting on " + config.ip + ':' + config.port + " IP: " + ip.getPrivateIp());
});

/*var timeout = express.timeout // express v3 and below
var timeout = require('connect-timeout'); //express v4

app.use(timeout(120000));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next){
    if (!req.timedout) next();
}*/

if(process.argv[3] === "local")
{
    info.setLocal(true);
    config.balancerIp = "172.17.0.2";
    console.log("working in local");

}

if (process.argv[2] === "master") {

    startMasterFn(false);
}
else {

    startSlaveFn();

}

ddb.setDynamoAccess();
s3Controller.setS3Connection();

function startMasterFn(proclamation)
{
    info.setInfoMaster(true);
    console.log('I am the master.');

    topologyMasterController.subscribeToBalancer(proclamation);
    topologyMasterController.heartbeatMessage();
    backupController.periodicBackup();
}
function startSlaveFn()
{

    info.setInfoMaster(false);
    console.log('I am a slave.');

    topologySlaveController.findMaster();
    topologySlaveController.subscribeToMaster();
    topologySlaveController.waitHeartbeat();
}