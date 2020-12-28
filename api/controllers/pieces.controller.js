const db = require('../models');

const Pieces = db.pieces;

exports.allPieces = async (req, res) => {
    const pieces = await Pieces.find();

    res.status(200).send({ data: pieces });
};

exports.singlePiece = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Piece Number.", data: [] });

        return;
    }

    const query = {
        $or : [
            { boid: req.params.id },
            { elementId: req.params.id },
            { rebrickPartNum: req.params.id }
        ]
    };

    const piece = await Pieces.find(query);

    res.status(200).send({ data: piece });
};

exports.savePiece = async (req, res) => {
    res.status(200).send({ message: "Will save a LEGO piece to the main Pieces collection." });
};
