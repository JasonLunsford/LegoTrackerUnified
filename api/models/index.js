const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require('./user.model');
db.role = require('./role.model');
db.sets = require('./sets.model');
db.userSets = require('./userSets.model');
db.sets = require('./pieces.model');
db.userSets = require('./userPieces.model');

db.ROLES = ["user", "admin"];

module.exports = db;
