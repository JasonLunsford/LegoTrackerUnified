const mongoose = require('mongoose');

const UserSets = mongoose.model(
    "UserSets",
    new mongoose.Schema({
        name: String
    })
);

module.exports = UserSets;
