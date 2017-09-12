// This application uses express as its web server

var express = require('express');
var bodyParser = require('body-parser');

// create a new express server
var app = express();
app.use(bodyParser.json());
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the port from environment
var port = process.env.PORT || 6601;

// TODO Differenziare il master da slave

require('./routes/masterRoute')(app);
require('./routes/chunkRoute')(app);

// start server on the specified port and binding host
app.listen(port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on localhost");
});
