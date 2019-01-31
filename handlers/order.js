/*
 * Orders
 *
 */

// Dependencies
const _data = require('../lib/dataAsync');
const helpers = require('../lib/helpers');

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
order.post = data => {
    const token = helpers.getTokenFromHeaders(data);
console.log('token!');
    if (!token) {
        return Promise.reject({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    const email = helpers.getEmailFromBody(data);

console.log(email);

    return verifyToken(token, email)
        .catch(err => Promise.reject({
            ...helpers.code400,
            error: 'Error on verifying token ', 
            details: err
        }))
        .then(() => {
            if (!email) {
                return Promise.reject({
                    ...helpers.code400,
                    error: 'Missing required field'
                });
            }
console.log('reading carts');
            return _data.read('carts', email)
                .catch(err => Promise.reject({
                    ...helpers.code500,
                    error: 'Could not read the shopping cart',
                    details: err
                }))
        })
        .then(cartData => {
            if (!_data.fileExists('orders', email)) {
                return Promise.reject({
                    ...helpers.code400,
                    error: 'This user already has created an order'
                });
            }
console.log('creating order');
            return _data.create('orders', email, cartData)
                .catch(err => Promise.reject({
                    ...helpers.code500,
                    error: 'Could not create a new order',
                    details: err
                }))
                .then(() => Promise.resolve(helpers.code200))
        });
}

module.exports = order;