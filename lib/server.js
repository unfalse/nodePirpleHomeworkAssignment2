/*
 * Primary file for the API
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');

var config = require('./config');
// var handlers = require('./handlers');
var handlers = require('../handlers');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');

// var _data = require('./lib/data');

// TESTING

// TESTING
// TODO: delete this


var server = {};

// Instantiating the HTTP server
server.httpServer = http.createServer(function(req, res) {
    console.log('http server started');
    server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
    server.unifiedServer(req, res);
});

// All the server logic for both the http and https server
server.unifiedServer = function(req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

console.log('server 51');

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
console.log('server 71');
        buffer += decoder.write(data);
    });
    req.on('end', function() {
console.log('server 75');
        buffer += decoder.end();

        // Choose the handler this request should go to
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined'
            ? server.router[trimmedPath]
            : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method' : method,
            'headers': headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
debug(chosenHandler);
        // Route the request to the handler specified in the router
        chosenHandler(data)
            .then(rawPayload => {
console.log('server 95');
                debug('Raw payload: ', rawPayload);
                const { statusCode = 200, error = '', details = '', payload = '' } = rawPayload;
                // Use the status code called back by the handler or default to 200
                // statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

                // Use the payload called back by the handler, or default to empty object
                // payload = typeof(payload) == 'object' ? payload : {};

                // Convert the payload to a string
                const responseResult = error.length ? error : payload;
                const responseString = JSON.stringify(responseResult);

                // Return the response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(responseString);

                // Log the request path
                debug('Request received on path: '
                    + trimmedPath
                    + ' with this method: '
                    + method
                    + ' and with these query string parameters ', 
                    queryStringObject);
                debug('Error: ', error);
                debug('Details: ', details);
                debug('Payload string: ', responseString);

                // If the response is 200, print green, otherwise print red
                debug(`\x1b[32m%s\x1b[0m${method.toUpperCase()} /'${trimmedPath} ${statusCode}`);
            })
            .catch(err => {
                console.log(err);
                const errorText = 'Error happened when handling the request! Details: ' + JSON.stringify(err);
                const statusCode = err.statusCode ? err.statusCode : 500;
                const responseString = JSON.stringify(errorText);
                // print statusCode in red
                debug(`\x1b[31m%s\x1b[0m${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
                // Return the response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(responseString);
            })
    });
};

// Define a request router
server.router = {
    // 'ping': handlers.ping,
    'auth': handlers.auth,
    'user': handlers.users,
    'auth' : handlers.auth,
    'cart' : handlers.cart,
    'menuItem': handlers.menuItems,
    'order': handlers.order
    //'checks' : handlers.checks
};

 // Init script
 server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort,function(){
      console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on port '+config.httpPort);
    });
  
    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort,function(){
      console.log('\x1b[35m%s\x1b[0m','The HTTPS server is running on port '+config.httpsPort);
    });
  };

module.exports = server;