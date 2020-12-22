const mongoose = require('mongoose');

const UserPieces = mongoose.model(
    "UserPieces",
    new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User"
        },
        masterPieceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Pieces"
        },
        notes: {
            type:     String,
            trim:     true
        },
        pricePaid: {
            type:     String,
            trim:     true
        },
        count: {
            type:     Number,
            required: true,
            trim:     true
        }
    })
);

module.exports = UserPieces;
