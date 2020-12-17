const db = require('../models');

const Sets = db.Sets;

exports.allSets = (req, res) => {
  res.status(200).send({ message: "Will return all LEGO sets in main Sets collection." });
};

exports.singleSet = (req, res) => {
  res.status(200).send({ message: "Will return a single LEGO set from the main Sets collection." });
};

exports.saveSet = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO set to the main Sets collection." });
};
