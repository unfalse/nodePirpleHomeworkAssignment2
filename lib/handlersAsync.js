/*
 * Request handlers (async/await version)
 *
 */

// Dependencies
const _data = require('./dataAsync');
const helpers = require('./helpers');
// var config = require('./config');

// Define the handlers
const handlers = {};

handlers.ping = () => Promise.resolve(200);
handlers.notFound = () => Promise.resolve(404);

handlers.users = async function(data) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) === -1) {
        return Promise.reject({ statusCode: 405 });
    }

    let result;
    try {
        result = await handlers._users[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

handlers._users = {};

handlers.tokens = async function(data){
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) === -1) {
        return Promise.reject({ statusCode: 405 });
        // handlers._tokens[data.method](data,callback);
    }

    let result;
    try {
        result = await handlers._tokens[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// Container for all the tokens methods
handlers._tokens  = {};

const getField = (field, data) => {
    return typeof(data.payload[field]) == 'string'
        && data.payload[field].trim().length > 0
        ? data.payload[field].trim() : false;
}

const getEmail = data => {
    const email = getField('email', data);
    if (email && email.indexOf('@') > -1) return email;
    return false;
}

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
handlers._users.post = async function(data) {
    var name = getField('name', data);
    var email = getEmail(data);
    var streetAddress = getField('streetAddress', data);
    var password = getField('password', data);

    if (!(name && email && password && streetAddress)) {
        return Promise.reject({
            statusCode: 400,
            error: 'Missing required fields'
        });
    }

    if (_data.userExists('users', email)) {
        return Promise.reject({
            statusCode: 400,
            error: 'A user with that email already exists'
        });
    }

    const hashedPassword = helpers.hash(password);

    if (!hashedPassword) {
        return Promise.reject({
            statusCode: 500,
            error: 'Could not hash the user\'s password.'
        });
    }

    const userObject = {
        name,
        email,
        streetAddress,
        hashedPassword
    };

    try {
        await _data.create('users', email, userObject)
        return Promise.resolve({ statusCode: 200 });
    }
    catch(err) {
        return Promise.reject({
            statusCode: 500,
            error: 'Could not create the new user',
            details: err
        });
    }
};

// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
// Required data: phone
// Optional data: none
handlers._users.get = async function(data){
    // Check that phone number is valid
    // var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    const email = getEmail(data);
    if (!email) {
        return Promise.reject({
            statusCode: 400,
            error: 'Missing required field'
        });
    }
    // Get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    
    let tokenIsValid;
    try{
        // Verify that the given token is valid for the phone number
        tokenIsValid = await handlers._tokens.verifyToken(token, email);
    }
    catch(err) {
        return Promise.reject('Error on verifying token. Details: ', err);
    }

    if (!tokenIsValid) {
        return Promise.reject({
            statusCode: 403,
            error: "Missing required token in header, or token is invalid."
        });
    }

    let userData;
    try {
        userData = await _data.read('users', email);
    }
    catch(err) {
        return Promise.reject({
            statusCode: 404,
            details: err
        });
    }

    delete userData.hashedPassword;
    return Promise.resolve({
        statusCode: 200,
        payload: userData
    });
};

handlers._tokens.post = async function(data) {
    const email = getEmail(data);
    const password = getField('password', data);
    if (!(email && password)) {
        return Promise.reject({
            statusCode: 400,
            error: 'Missing required field(s).'
        });
    }

    let userData;
    try {
        userData = await _data.read('users', email);
    }
    catch(err) {
        return Promise.reject({
            statusCode: 400,
            error:'Could not find the specified user.',
            details: err
        });
    }

    const hashedPassword = helpers.hash(password);
    if (hashedPassword !== userData.hashedPassword) {
        return Promise.reject({
            statusCode: 400,
            error: 'Password did not match the specified user\'s stored password'
        });
    }

    // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
    const tokenId = helpers.createRandomString(20);
    const expires = Date.now() + 1000 * 60 * 60;
    const tokenObject = {
        email,
        id: tokenId,
        expires
    };

    try {
        await _data.create('tokens', tokenId, tokenObject);
    }
    catch(err) {
        return Promise.reject({
            statusCode: 500,
            error: 'Could not create the new token',
            details: err
        });
    }

    return Promise.resolve({
        statusCode: 200,
        payload: tokenObject
    });
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = async function(id, email) {
    let tokenData;
    try {
        tokenData = await _data.read('tokens',id);
    }
    catch(err) {
        return Promise.reject(err);
    }

    if(!(tokenData.email == email && tokenData.expires > Date.now())) {
        return Promise.reject(false);
    }
    return Promise.resolve(true);
};

module.exports = handlers;

// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
// Required data: phone
// Optional data: none
// handlers._users.get = async function(data, callback){
//     // Check that phone number is valid
//     // var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
//     const email = getEmail(data);
//     if(email){
  
//       // Get token from headers
//       var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
//       // Verify that the given token is valid for the phone number
//       handlers._tokens.verifyToken(token,email,function(tokenIsValid){
//         if(tokenIsValid){
//           // Lookup the user
//           _data.read('users', email, function(err, data){
//             if(!err && data){
//               // Remove the hashed password from the user user object before returning it to the requester
//               delete data.hashedPassword;
//               callback(200, data);
//             } else {
//               callback(404);
//             }
//           });
//         } else {
//           callback(403, {"Error" : "Missing required token in header, or token is invalid."})
//         }
//       });
//     } else {
//       callback(400, {'Error' : 'Missing required field'})
//     }
//   };