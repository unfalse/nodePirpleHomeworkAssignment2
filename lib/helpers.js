/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

helpers.sendTwilioSms = function(phone,msg,callback){
  // Validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if(phone && msg){

    // Configure the request payload
    var payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+1'+phone,
      'Body' : msg
    };
    var stringPayload = querystring.stringify(payload);


    // Configure the request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
          callback(false);
        } else {
          callback('Status code returned was '+status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

  } else {
    callback('Given parameters were missing or invalid');
  }
};

helpers.createStripeOrder = (orderDetails, callback) => {
  setTimeout(() => {
    console.log('Order has successfully sent!')
    callback('ok');
  }, 2000);
};

helpers.sendAMailgunEmail = (emailDetails, callback) => {
  setTimeout(() => {
    console.log('Email has successfully sent!')
    callback('ok');
  }, 2000);
}

helpers.getCode = code => ({ statusCode: code });

helpers.getFieldFromBody = (field, data) => {
  return typeof(data.payload[field]) == 'string'
      && data.payload[field].trim().length > 0
      ? data.payload[field].trim() : false;
}

helpers.getObjectFromBody = (field, data) => {
  return typeof(data.payload[field]) == 'object'
      ? data.payload[field]
      : false;
}

helpers.getEmail = data => {
  const emailRaw = data.queryStringObject.email;
  const email = typeof(emailRaw) == 'string' &&
      emailRaw.trim().length > 0 ? emailRaw.trim() : false;
  if (email && email.indexOf('@') > -1) return email;
  return false;
}

helpers.getEmailFromBody = data => {
  const email = helpers.getFieldFromBody('email', data);
  if (email && email.indexOf('@') > -1) return email;
  return false;
}

helpers.getTokenFromHeaders = data => {
  return typeof(data.headers.token) == 'string' ?
    data.headers.token :
    false;
}

const codes = {
    code200: helpers.getCode(200),
    code404: helpers.getCode(404),
    code404: helpers.getCode(405),
    code400: helpers.getCode(400),
    code500: helpers.getCode(500)
};

// Export the module
module.exports = {
  ...helpers,
  ...codes
};