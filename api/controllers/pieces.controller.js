const db = require('../models');

const Pieces = db.Pieces;

exports.allPieces = (req, res) => {
  res.status(200).send({ message: "Will return all LEGO pieces in main Pieces collection." });
};

exports.singlePiece = (req, res) => {
  res.status(200).send({ message: "Will return a single LEGO piece from the main Pieces collection." });
};

exports.savePiece = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO piece to the main Pieces collection." });
};
