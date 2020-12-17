const db = require('../models');

const UserSets = db.userSets;

exports.allUserSets = (req, res) => {
  res.status(200).send({ message: "Will return all LEGO sets in a User's Sets collection." });
};

exports.singleUserSet = (req, res) => {
  res.status(200).send({ message: "Will return a single LEGO set from a User's Sets collection." });
};

exports.saveUserSet = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO set to a User's Sets collection." });
};
