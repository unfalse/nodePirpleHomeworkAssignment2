/*
 * Orders
 *
 */

// Dependencies
const helpers = require('../lib/helpers');

// Order
const _order = {};
const order = async function(data){
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) === -1) {
        return Promise.resolve(helpers.code405);
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

// Places an order and pay immediately
// 
// email: string, menuItems?: [], order?: true
// Request:
//  header: token
//  body: email, menuItems?, order?
// Response:
//  200 / 400 + error
order.post = data => {
    const email = helpers.getEmailFromBody(data);
    if (!email) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }

}

module.exports = order;