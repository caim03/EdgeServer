// This application uses express as its web server

var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config/config');
var info = require('./model/serverInfo');
var masterController = require('./controllers/masterController');
var chunkController = require('./controllers/chunkController');

var master = true;

// create a new express server
var app = express();
app.use(bodyParser.json());
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the port from environment
var port = config.port;
var ipAddr = config.ip;

// TODO Subscribe Load Balancer
// TODO Elezione imposta la variabile master a true o false

require('./routes/masterRoute')(app);
require('./routes/chunkRoute')(app);

// start server on the specified port and binding host
app.listen(port, ipAddr, function() {
  // print a message when the server starts listening
  console.log("server starting on localhost");
});

if (config.master) {
    masterController.subscribeToBalancer();
}
else {
    chunkController.findMaster();
    chunkController.subscribeToMaster();
}
