const auth = require('./auth').auth;
const cart = require('./cart');
const menuItems = require('./menuItems');
const order = require('./order');
const users = require('./users');

module.exports = {
    auth,
    cart,
    menuItems,
    order,
    users
}