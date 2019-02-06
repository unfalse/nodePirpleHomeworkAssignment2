/*
 * Orders
 *
 */

// Dependencies
const _data = require('../lib/dataAsync');
const helpers = require('../lib/helpers');
const verifyToken = require('./auth').verifyToken;

const ACCEPTABLE_METHODS = ['post'];

// Order
const _order = {};
const order = async function(data){
    if(!ACCEPTABLE_METHODS.includes(data.method)) {
        return Promise.reject(helpers.code405);
    }

    let result;
    try {
        result = await _order[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// Places an order
// 
// email: string, menuItems?: [], order?: true
// Request:
//  header: token
//  body: email, menuItems?, order?
// Response:
//  200 / 400 + error
_order.post = data => {
    const token = helpers.getTokenFromHeaders(data);
    if (!token) {
        return Promise.reject({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    const email = helpers.getEmailFromBody(data);
    const action = helpers.getFieldFromBody('action', data);
    if (!action) {
        return Promise.reject({
            ...helpers.code400,
            error: 'Missing action field'
        });
    }

    return verifyToken(token, email)
        .catch(err => Promise.reject({
            ...helpers.code400,
            error: 'Error on verifying token ', 
            details: err
        }))
        .then(() => {
            if (action === 'create') {
                createOrder(data);
            } else if (action === 'pay') {
                payForOrder(data);
            }

            
        })
        .then(cartData => {
            if (_data.fileExists('orders', email)) {
                return Promise.reject({
                    ...helpers.code400,
                    error: 'This user already has created an order'
                });
            }
            return _data.create('orders', email, cartData)
                .catch(err => Promise.reject({
                    ...helpers.code500,
                    error: 'Could not create a new order',
                    details: err
                }))
                .then(() => Promise.resolve(helpers.code200))
        });
}

// TODO: finish it !!!
const createOrder = () => {
    console.log('Creating order!');
    return Promise.resolve()
    if (!email) {
        return Promise.reject({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    return _data.read('carts', email)
        .catch(err => Promise.reject({
            ...helpers.code500,
            error: 'Could not read the shopping cart',
            details: err
        }))
}

const payForOrder = () => {
    console.log('Paying for order!');
}

module.exports = order;