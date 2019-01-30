/*
 * Tokens
 *
 */

// Dependencies
const _data = require('../lib/dataAsync');
const helpers = require('../lib/helpers');

const auth = async function(data){
    const acceptableMethods = ['post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) === -1) {
        return Promise.resolve(helpers.code405);
    }

    let result;
    try {
        result = await _auth[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// Container for all the auth methods
const _auth  = {};

// [POST] Creates a token for a given user
// body(json): email, password
_auth.post = async function(data) {
    const email = helpers.getEmailFromBody(data);
    const password = helpers.getFieldFromBody('password', data);
    if (!(email && password)) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field(s).'
        });
    }

    let userData;
    try {
        userData = await _data.read('users', email);
    }
    catch(err) {
        return Promise.resolve({
            ...helpers.code400,
            error:'Could not find the specified user.',
            details: err
        });
    }

    const hashedPassword = helpers.hash(password);
    if (hashedPassword !== userData.hashedPassword) {
        return Promise.resolve({
            ...helpers.code400,
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
        return Promise.resolve({
            ...helpers.code500,
            error: 'Could not create the new token',
            details: err
        });
    }

    return Promise.resolve({
        ...helpers.code200,
        payload: tokenObject
    });
}

// TODO: remove it completely ?
// [GET] Return data from token using given id
// query: id
//
// Required data: id
// Optional data: none
// _auth.get = async function(data) {
//     const id = typeof(data.queryStringObject.id) == 'string'
//         && data.queryStringObject.id.trim().length == 20
//         ? data.queryStringObject.id.trim()
//         : false;
//     if (!id) {
//         return Promise.resolve({
//             ...helpers.code400,
//             error: 'Missing required field, or field invalid'
//         });
//     }

//     let tokenData;
//     try {
//         tokenData = await _data.read('tokens',id);
//     }
//     catch(err) {
//         return Promise.resolve({
//             ...helpers.code404,
//             error: 'Error on reading token data',
//             details: err
//         });
//     }

//     return Promise.resolve({
//         ...helpers.code200,
//         payload: tokenData
//     });
// }

// Verify if a given token id is currently valid for a given user
_auth.verifyToken = async function(id, email) {
    let tokenData;
    try {
        tokenData = await _data.read('tokens',id);
    }
    catch(err) {
        return Promise.reject(err);
    }
    if (tokenData.expires < Date.now()) {
        return Promise.reject('Token has expired');
    }
    if(tokenData.email !== email) {
        return Promise.reject('Wrong email');
    }
    return Promise.resolve(true);
};

// _auth.verifyTokenSync = (id, email) => {
//     let tokenData;
//     try {
//         tokenData = await _data.read('tokens',id);
//     }
//     catch(err) {
//         return Promise.reject(err);
//     }
//     if (tokenData.expires < Date.now()) {
//         return Promise.reject('Token has expired');
//     }
//     if(tokenData.email !== email) {
//         return Promise.reject('Wrong email');
//     }
//     return Promise.resolve(true);
// }

// [DELETE] Deletes token by the given id (or simply log out)
// query: id
_auth.delete = function(data) {
    var id = typeof(data.queryStringObject.id) == 'string'
        && data.queryStringObject.id.trim().length == 20
        ? data.queryStringObject.id.trim()
        : false;
    if (!id) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    if (!_data.fileExists('tokens', id)) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Could not find the specified token.'
        });
    }
    return _data.delete('tokens', id)
        .catch(err => {
            return Promise.resolve({
                ...helpers.code500,
                error: 'Could not delete the specified token.',
                details: err
            });
        })
        .then(() => {
            return Promise.resolve({
                ...helpers.code200
            })
        });
}

module.exports = {
    auth,
    verifyToken: _auth.verifyToken
};