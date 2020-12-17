const mongoose = require('mongoose');

const UserPieces = mongoose.model(
    "UserPieces",
    new mongoose.Schema({
        name: String
    })
);

module.exports = UserPieces;
