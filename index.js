/*
 * Primary file for API
 *
 */

// Launch variants:
// NODE_DEBUG=server node index.js
// node index.js

// Dependencies
var server = require('./lib/server');

// Declare the app
var app = {};

// Init function
app.init = function(){

  // Start the server
  server.init();

  // Start the workers
  // workers.init();

};

// Self executing
app.init();


// Export the app
module.exports = app;