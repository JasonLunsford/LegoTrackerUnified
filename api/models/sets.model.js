const mongoose = require('mongoose');

const Sets = mongoose.model(
    "Sets",
    new mongoose.Schema({
        baseSetNumber: {
            type:     String,
            required: true,
            trim:     true
        },
        boid: {
            type:     String,
            required: true,
            trim:     true
        },
        imgUrl: {
            type:     String,
            required: true,
            trim:     true
        },
        name: {
            type:     String,
            required: true,
            trim:     true
        },
        pieceCount: {
            type:     Number,
            required: true,
            trim:     true
        },
        pieces: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Pieces"
            }
        ],
        price: {
            type:     String,
            required: true,
            trim:     true
        },
        theme: {
            type:     String,
            required: true,
            trim:     true
        },
        year: {
            type:     Number,
            required: true,
            trim:     true
        },
    })
);

module.exports = Sets;
