const mongoose = require('mongoose');

const UserSets = mongoose.model(
    "UserSets",
    new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User"
        },
        masterSetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Sets"
        },
        notes: {
            type:     String,
            required: true,
            trim:     true
        },
        pricePaid: {
            type:     String,
            required: true,
            trim:     true
        }
    })
);

module.exports = UserSets;
