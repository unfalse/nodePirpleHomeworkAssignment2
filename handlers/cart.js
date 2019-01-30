/*
 * Shopping cart
 *
 */

// Dependencies
const _data = require('../lib/dataAsync');
const getCode = require('../lib/helpers').getCode;
const helpers = require('../lib/helpers');
const verifyToken = require('./auth').verifyToken;

const ACCEPTABLE_METHODS = ['post','get'];

// Shopping cart
const _cart = {};
const cart = async function(data){
    if(ACCEPTABLE_METHODS.indexOf(data.method) === -1) {
        return Promise.resolve(helpers.code405);
    }

    let result;
    try {
        result = await _cart[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// Get shopping cart contents
_cart.get = () => {
    return Promise.reject({
        ...getCode(500),
        error: 'Method isn\'t implemented yet'
    });
};

// [POST] Creates a new shopping cart with menu items.
// headers: token
// body(json): email, menuItems(as array: [ {id:0,quantity:1}, ... ])
//
// Creates a file named `email@domain_postfix.json` in a 'carts' directory with following contents:
// email: string, menuItems?: [], order?: true
// Request:
// Response:
//  200 / 400 + error
_cart.post = data => {
    const email = helpers.getEmailFromBody(data);
    const menuItems = helpers.getObjectFromBody('menuItems', data);
    if (!email || !menuItems || menuItems.length === 0) {
        return Promise.reject({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }

    const token = helpers.getTokenFromHeaders(data);
    return verifyToken(token, email)
        .catch(err => Promise.reject({
            ...helpers.code400,
            error: 'Error on verifying token ', 
            details: err
        }))
        .then(() => {
            const isCartExists = _data.fileExists('carts', email);
            if (isCartExists) {
                return Promise.reject({
                    ...helpers.code400,
                    error: 'This user already has a cart'
                });
            }

            const cartData = {
                email,
                menuItems
            };
            return _data.create('carts', email, cartData)
                .catch(err => Promise.reject({
                    ...helpers.code500,
                    error: 'Could not create the new cart',
                    details: err
                }))
                .then(() => Promise.resolve(helpers.code200))
        });
};

module.exports = cart;