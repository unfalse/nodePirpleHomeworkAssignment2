/*
 * Request handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define the handlers
var handlers = {};

handlers.ping = function(data, callback) {
    callback(200);
};

handlers.notFound = function(data, callback) {
    callback(404);
};



handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
};

handlers._users = {};

function getField(field, data) {
    return typeof(data.payload[field]) == 'string'
        && data.payload[field].trim().length > 0
        ? data.payload[field].trim() : false;
}

function getEmail(data) {
    const email = getField('email', data);
    if (email && email.indexOf('@') > -1) return email;
    return false;
}

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
handlers._users.post = function(data, callback) {
    var name = getField('name', data);
    var email = getEmail(data);
    var streetAddress = getField('streetAddress', data);
    var password = getField('password', data);

    if (name && email && password && streetAddress) {
        // Make sure the user doesnt already exist
        _data.read('users', email, function(err) {
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);
        
                // Create the user object
                if(hashedPassword){
                    var userObject = {
                        'name' : name,
                        'email' : email,
                        'streetAddress' : streetAddress,
                        'hashedPassword' : hashedPassword
                    };

                    // Store the user
                    _data.create('users', email, userObject, function(err) {
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500,{'Error' : 'Could not create the new user'});
                        }
                    });
                } else {
                    callback(500, { 'Error' : 'Could not hash the user\'s password.' });
                }
            } else {
                // User already exists
                callback(400, { 'Error' : 'A user with that email already exists' });
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required fields'});
    }
};

// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
// Required data: phone
// Optional data: none
handlers._users.get = function(data,callback){
  // Check that phone number is valid
  // var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  const email = getEmail(data);
  if(email){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users', email, function(err, data){
          if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid."})
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
};


// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  // var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  const email = getEmail(data);
  if (email) {

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    tokens.verifyToken(token, email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users', email, function(err, userData) {
          if(!err && userData){
            // Delete the user's data
            _data.delete('users', email, function(err) {
              if(!err) {
                // Delete each of the checks associated with the user
                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if(checksToDelete > 0){
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach(function(checkId){
                    // Delete the check
                    _data.delete('checks',checkId,function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        } else {
                          callback(500,{'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};




// Tokens
handlers.tokens = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);
    }
};
  
  // Container for all the tokens methods
  handlers._tokens  = {};
  
  // Tokens - post
  // Required data: phone, password
  // Optional data: none
  handlers._tokens.post = function(data,callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
      // Lookup the user who matches that phone number
      _data.read('users',phone,function(err,userData){
        if(!err && userData){
          // Hash the sent password, and compare it to the password stored in the user object
          var hashedPassword = helpers.hash(password);
          if(hashedPassword == userData.hashedPassword){
            // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
            var tokenId = helpers.createRandomString(20);
            var expires = Date.now() + 1000 * 60 * 60;
            var tokenObject = {
              'phone' : phone,
              'id' : tokenId,
              'expires' : expires
            };
  
            // Store the token
            _data.create('tokens',tokenId,tokenObject,function(err){
              if(!err){
                callback(200,tokenObject);
              } else {
                callback(500,{'Error' : 'Could not create the new token'});
              }
            });
          } else {
            callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
          }
        } else {
          callback(400,{'Error' : 'Could not find the specified user.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field(s).'})
    }
  };
  
  // Tokens - get
  // Required data: id
  // Optional data: none
  handlers._tokens.get = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          callback(200,tokenData);
        } else {
          callback(404);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field, or field invalid'})
    }
  };
  
  // Tokens - put
  // Required data: id, extend
  // Optional data: none
  handlers._tokens.put = function(data,callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
      // Lookup the existing token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          // Check to make sure the token isn't already expired
          if(tokenData.expires > Date.now()){
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60;
            // Store the new updates
            _data.update('tokens',id,tokenData,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not update the token\'s expiration.'});
              }
            });
          } else {
            callback(400,{"Error" : "The token has already expired, and cannot be extended."});
          }
        } else {
          callback(400,{'Error' : 'Specified user does not exist.'});
        }
      });
    } else {
      callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
    }
  };
  
  
  // Tokens - delete
  // Required data: id
  // Optional data: none
  handlers._tokens.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          // Delete the token
          _data.delete('tokens',id,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not delete the specified token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Could not find the specified token.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
  };
  
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,phone,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


handlers.auth = function(data, callback) {
  var acceptableMethods = ['post'];
  if(acceptableMethods.indexOf(data.method) > -1) {
      handlers._auth[data.method](data, callback);
  } else {
      callback(405);
  }

  // Container for all the tokens methods
  handlers._auth  = {};

  handlers.auth.post = () => {
    // TDOO: 1. Log in => get a token using users phone and password (just like with tokens)
    // TODO: 2. Log out => destroy a token by given users creds
  };
};



// Export the module
module.exports = handlers;