const mongoose = require('mongoose');

const Sets = mongoose.model(
    "Sets",
    new mongoose.Schema({
        name: String
    })
);

module.exports = Sets;
