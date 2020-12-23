const mongoose = require('mongoose');

const Pieces = mongoose.model(
    "Pieces",
    new mongoose.Schema({
        elementId: {
            type:     String,
            required: true,
            trim:     true
        },
        name: {
            type:     String,
            required: true,
            trim:     true
        },
        imgUrl: {
            type:     String,
            required: true,
            trim:     true
        },
        boid: {
            type:     String,
            required: true,
            trim:     true
        },
        rebrickPartNum: {
            type:     String,
            required: true,
            trim:     true
        },
        color: {
            type:     String,
            required: true,
            trim:     true
        },
        price: {
            type:     String,
            required: true,
            trim:     true
        }
    })
);

module.exports = Pieces;
