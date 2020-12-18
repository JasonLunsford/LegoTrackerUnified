const axios = require('axios');

exports.brickOwlV1 = axios.create({
    baseURL: 'https://api.brickowl.com/v1'
});

exports.rebrickV3 = axios.create({
    baseURL: 'https://rebrickable.com/api/v3/lego'
});
