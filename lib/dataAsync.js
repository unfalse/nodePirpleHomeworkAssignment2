"use strict";
// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const openAsync = promisify(fs.open);
const writeFileAsync = promisify(fs.writeFile);
const closeAsync = promisify(fs.close);
const unlinkAsync = promisify(fs.unlink);

// Container for the module (to be exported)
var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = async function(dir, fileName, data) {
    let stringData = '';
    let fileDescriptor = null;
    try {
        fileDescriptor = await openAsync(lib.baseDir + dir + '/' + fileName + '.json', 'wx');
        stringData = JSON.stringify(data);
    }
    catch(err) {
        return Promise.reject('Could not create new file, it may already exist. Details: ' + err);
    }

    try {
        await writeFileAsync(fileDescriptor, stringData);
        return Promise.resolve('ok');
    }
    catch(err) {
        try {
            await closeAsync(fileDescriptor);
            return Promise.resolve(false);
        }
        catch(err2) {
            return Promise.reject('Error closing new file ' + err2);
        }
    }
};

// Read data from a file
lib.read = async function(dir, file) {
    // console.log(dir);
    // console.log(file);
    let data;
    try {
        data = await readFileAsync(lib.baseDir + dir + '/' + file + '.json', 'utf8');
        // console.log('read ok ', data);
        return Promise.resolve(helpers.parseJsonToObject(data));
    }
    catch(err) {
        return Promise.reject('Error on reading the file! Details: ' + err + ' data: ' + data);
    }
};

// Update data inside a file
lib.update = async function(dir, file, data) {
    let fileDescriptor;
    let stringData;
    // Open the file for writing
    try {
        fileDescriptor = await openAsync(lib.baseDir + dir + '/' + file + '.json', 'r+');
        stringData = JSON.stringify(data);
    }
    catch(err) {
        return Promise.reject('Could not open the file for updating, it may not exist yet. Details: ', err);
    }

    try {
        await ftruncateAsync(fileDescriptor);
    }
    catch(err) {
        return Promise.reject('Error truncating file. Details: ', err);
    }

    try {
        await writeFileAsync(fileDescriptor, stringData);
    }
    catch(err) {
        return Promise.reject('Error writing to existing file. Details: ', err);
    }

    try {
        await closeAsync(fileDescriptor);
        return Promise.resolve(false);
    }
    catch(err) {
        return Promise.reject('Error closing existing file. Details: ', err);
    }
};

lib.delete = async function(dir, file) {
    // Unlink the file
    const fullPath = lib.baseDir + dir + '/' + file + '.json';
    try {
        await unlinkAsync(fullPath)
    }
    catch(err) {
        console.log(err);
        return Promise.reject('Error deleting file! Details: ', err);
    }
    return Promise.resolve(false);
};

lib.fileExists = function(dir, fileName) {
    const fullPath = lib.baseDir + dir + '/' + fileName + '.json';
    //console.log(fullPath);
    return fs.existsSync(fullPath);
}

module.exports = lib;