const handlers = require('./handlers');
const _data = require('./lib/dataAsync');

const testUsersPost = () => {
    var post = handlers.users({
        method: 'post',
        payload: {
            name: 'John',
            email: 'john@gmail.com',
            streetAddress: 'Gubaidullina street 1',
            password: '123456'
        }
    });

    console.log(post);

    post.then(result => {
        console.log('all is ok, result: ', result);
    })
    .catch(err => {
        console.log('Error! Details: ', err);
    });
}

const testUsersGet = () => {
    const get = handlers.users({
        method: 'get',
        headers: {
            token: 'pmngbv8v6m4dyeidu5re'
        },
        payload: {
            email: 'john@gmail.com'
        }
    });

    console.log(get);

    get.then(result => {
        console.log('all is ok, result: ', result);
    })
    .catch(err => {
        console.log('Error! Details: ', err);
    });
};

const testTokenPost = () => {
    const post = handlers.auth({
        method: 'post',
        payload: {
            email: 'john@gmail.com',
            password: '123456'
        }
    });

    post.then(result => {
        console.log('all is ok. Result: ', result);
    })
    .catch(err => {
        console.log('Error! Details: ', err);
    });
}

const testTokenDelete = () => {
    const tokenDelete = handlers.auth({
        method: 'delete',
        queryStringObject: {
            id: '8cq8x7hpt6it7f6olhzh'
        }
    });

    tokenDelete
        .then(result => {
            console.log('Ok! Result: ', result);
        })
        .catch(err => {
            console.log('Error! Details: ', err);
        });
}

_data.create('test', 'newFile', {'foo' : 'bar'}, function(err) {
    console.log('data.create error: ', err);
});
_data.read('test', 'newFile1', function(err, data) {
    console.log('data.read error: ', err, ' and this was the data: ', data);
});
_data.update('test', 'newFile', {'fizz' : 'buzz'}, function(err) {
    console.log('data.update error: ', err);
});
_data.delete('test', 'newFile', function(err) {
    console.log('data.delete error: ', err);
});

if(!true) {
    helpers.sendTwilioSms('4158375309', 'Hello from Belarus!', function(err){
        console.log('Twilio error: ', err);
    });
}

// testUsersGet();
// testTokenPost();
// testTokenDelete();