// This application uses express as its web server

var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config/config');
var masterController = require('./controllers/masterController');
var chunkController = require('./controllers/chunkController');
var info = require('./model/serverInfo');
var ip = require('ip');

// create a new express server
var app = express();
app.use(bodyParser.json());
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

require('./routes/masterRoute')(app);
require('./routes/chunkRoute')(app);

// start server on the specified port and binding host
app.listen(config.port, config.ip, function() {
  // print a message when the server starts listening
  console.log("server starting on " + config.ip + ':' + config.port + " IP: " + ip.address());
});


if (process.argv[2] === "master") {
    info.setInfoMaster(true);

    masterController.subscribeToBalancer();
    masterController.heartbeatMessage();
}
else {
    info.setInfoMaster(false);

    chunkController.findMaster();
    chunkController.subscribeToMaster();
    chunkController.waitHeartbeat();
}