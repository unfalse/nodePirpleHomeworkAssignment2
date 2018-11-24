const handlers = require('./lib/handlersAsync');

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
    const post = handlers.tokens({
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

// testUsersGet();
// testTokenPost();