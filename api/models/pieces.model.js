const mongoose = require('mongoose');

const Pieces = mongoose.model(
    "Pieces",
    new mongoose.Schema({
        name: String
    })
);

module.exports = Pieces;
