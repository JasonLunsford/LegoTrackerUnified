const db = require('../models');

const Pieces = db.pieces;
const UserPieces = db.userPieces;
const User = db.user;

exports.allUserPieces = async (req, res) => {
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const userPieces = await UserPieces.find({ userId: currentUser._id });
    const masterPieces = await Pieces.find();

    const piecesData = [];

    // This is a very expensive way to go about merging data from Master Pieces and User Pieces.
    // Note to self: figure out a cheaper way to do this
    userPieces.forEach(userPiece => {
        masterPieces.forEach(masterPiece => {
            // Need to coerce these props into strings so we can evaluate them properly
            if (String(userPiece.masterPieceId) === String(masterPiece._id)) {
                piecesData.push({
                    elementId:      masterPiece.elementId,
                    name:           masterPiece.name,
                    imgUrl:         masterPiece.imgUrl,
                    boid:           masterPiece.boid,
                    rebrickPartNum: masterPiece.rebrickPartNum,
                    color:          masterPiece.color,
                    price:          masterPiece.price,
                    pricePaid:      userPiece.pricePaid,
                    count:          userPiece.count,
                    notes:          userPiece.notes
                });
            }
        });
    });

    res.status(200).send({ data: piecesData });
};

exports.singleUserPiece = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Piece Number.", data: [] });

        return;
    }

    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const userPieces = await UserPieces.find({ userId: currentUser._id });

    const query = {
        $or : [
            { boid: req.params.id },
            { elementId: req.params.id },
            { rebrickPartNum: req.params.id }
        ]
    };

    const masterPieces = await Pieces.find(query);

    if (!masterPieces.length) {
        res.status(200).send({ message: "Unable to locate core piece data.", data: [] });

        return;
    }

    const data = [];
    let userPieceFound = false;
    // const userPiece = userPieces.find(item => String(item.masterPieceId) === String(masterPieces[0]._id));

    userPieces.forEach(userPiece => {
        masterPieces.forEach(masterPiece => {
            if (String(userPiece.masterPieceId) === String(masterPiece._id)) {
                userPieceFound = true;

                data.push({
                    elementId:      masterPiece.elementId,
                    name:           masterPiece.name,
                    imgUrl:         masterPiece.imgUrl,
                    boid:           masterPiece.boid,
                    rebrickPartNum: masterPiece.rebrickPartNum,
                    color:          masterPiece.color,
                    price:          masterPiece.price,
                    pricePaid:      userPiece.pricePaid,
                    count:          userPiece.count,
                    notes:          userPiece.notes
                })
            }
        });
    });

    if (!userPieceFound) {
        res.status(200).send({ message: "User does not own this piece.", data: [] });

        return;
    }

    res.status(200).send({ data });
};

exports.saveUserPiece = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO piece to a User's Pieces collection." });
};
