/*
 * Users
 *
 */

// Dependencies
const _data = require('../lib/dataAsync');
const helpers = require('../lib/helpers');
const verifyToken = require('./auth').verifyToken;

const _users = {};

const users = async function(data) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) === -1) {
        return Promise.resolve(helpers.code405);
    }

    let result;
    try {
        result = await _users[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// [POST] Creates a new user
// body(json): name, email, streetAddress, password
// Required data: firstname, lastname, phone, password, tosAgreement
_users.post = async function(data) {
    var name = helpers.getFieldFromBody('name', data);
    var email = helpers.getEmailFromBody(data);
    var streetAddress = helpers.getFieldFromBody('streetAddress', data);
    var password = helpers.getFieldFromBody('password', data);

    if (!(name && email && password && streetAddress)) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required fields'
        });
    }

    if (_data.fileExists('users', email)) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'A user with that email already exists'
        });
    }

    const hashedPassword = helpers.hash(password);

    if (!hashedPassword) {
        return Promise.resolve({
            ...helpers.code500,
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
    }
    catch(err) {
        return Promise.resolve({
            ...helpers.code500,
            error: 'Could not create the new user',
            details: err
        });
    }

    return Promise.resolve(helpers.code200);
};

// [GET] Returns info on a user
// headers: token
// query: email
//
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
// Required data: phone
// Optional data: none
_users.get = async function(data){
    const email = helpers.getEmail(data);
    if (!email) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    // Get token from headers
    const token = typeof(data.headers.token) == 'string'
        ? data.headers.token : false;

    let tokenIsValid;
    try{
        // Verify that the given token is valid for the phone number
        tokenIsValid = await verifyToken(token, email);
    }
    catch(err) {
        console.log('error on verifying token!');
        return Promise.resolve({
            ...helpers.code400,
            error: 'Error on verifying token',
            details: err
        });
    }

    if (!tokenIsValid) {
        return Promise.resolve({
            ...helpers.code403,
            error: "Missing required token in header, or token is invalid."
        });
    }
    let userData;
    try {
        userData = await _data.read('users', email);
    }
    catch(err) {
        return Promise.resolve({
            ...helpers.code404,
            details: err
        });
    }

    delete userData.hashedPassword;
    return Promise.resolve({
        ...helpers.code200,
        payload: userData
    });
};

// Removes the user by email
// headers: token
// query: email
_users.delete = async function(data) {
    const email = helpers.getEmail(data);
    if (!email) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }

    const token = typeof(data.headers.token) == 'string' ?
        data.headers.token :
        false;
    let tokenIsValid;
    try {
        tokenIsValid = await verifyToken(token, email);
    }
    catch(err) {
        return Promise.resolve({
            error: 'Cannot verify token',
            details: err
        });
    }

    if (!tokenIsValid) {
        return Promise.resolve({
            ...helpers.code403,
            error: "Missing required token in header, or token is invalid."
        });
    }

    let userData;
    let readErr;
    try {
        userData = await _data.read('users', email);
    }
    catch(err) {
        readErr = err;
    }

    if (readErr || !userData) {
        return Promise.resolve({
            ...helpers.code400,
            error:'Could not find the specified user.',
            details: readErr
        });
    }

    try {
        await _data.delete('users', email);
    }
    catch(err) {
        return Promise.resolve({
            ...helpers.code500,
            error: 'Could not delete the specified user',
            details: err
        });
    }

    return Promise.resolve(helpers.code200);
};

module.exports = users;