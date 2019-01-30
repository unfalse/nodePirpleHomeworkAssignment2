/*
 * Menu items for customers
 *
 */
// Dependencies
const helpers = require('../lib/helpers');
const verifyToken = require('./auth').verifyToken;

const ACCEPTABLE_METHODS = ['get'];
const MENU_ITEMS = [
    {
        id: 0,
        name: "Pepperoni",
        price: "$5"
    },
    {
        id: 1,
        name: "Coca-Cola",
        price: "$1"
    },
    {
        id: 2,
        name: "Vegi Pizza",
        price: "$4"
    }
];

const _menuItems = {};

const menuItems = async function(data){
    if(ACCEPTABLE_METHODS.indexOf(data.method) === -1) {
        return Promise.resolve(helpers.code405);
    }

    let result;
    try {
        result = await _menuItems[data.method](data);
        return Promise.resolve(result);
    }
    catch(err) {
        return Promise.reject(err);
    }
};

// [GET] Returns a list of all possible menu items for order
// headers: token
// query: email
_menuItems.get = function(data) {
    const email = helpers.getEmail(data);
    if (!email) {
        return Promise.resolve({
            ...helpers.code400,
            error: 'Missing required field'
        });
    }
    // Get token from headers
    const token = typeof(data.headers.token) == 'string'
        ? data.headers.token
        : false;
    return verifyToken(token, email)
        .catch(err => { 
            return Promise.reject({
                ...helpers.code400,
                error: 'Error on verifying token ', 
                details: err
            });
        })
        .then(() => {
            return Promise.resolve({
                ...helpers.code200,
                payload: MENU_ITEMS
            });
        });
};

module.exports = menuItems;