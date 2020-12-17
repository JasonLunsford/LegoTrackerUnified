const db = require('../models');

const UserPieces = db.userPieces;

exports.allUserPieces = (req, res) => {
  res.status(200).send({ message: "Will return all LEGO pieces in a User's Pieces collection." });
};

exports.singleUserPiece = (req, res) => {
  res.status(200).send({ message: "Will return a single LEGO piece from a User's Pieces collection." });
};

exports.saveUserPiece = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO piece to a User's Pieces collection." });
};
