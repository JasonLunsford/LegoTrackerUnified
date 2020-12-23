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

    const lookup = userPieces.reduce((a, e) => {
        a[e.masterPieceId] = ++a[e.masterPieceId] || 0;
        return a;
    }, {});

    console.log('dups?: ', userPieces.filter(item => lookup[item.masterPieceId]));

    res.status(200).send({ data: piecesData });
};

exports.singleUserPiece = (req, res) => {

};

exports.saveUserPiece = (req, res) => {
  res.status(200).send({ message: "Will save a LEGO piece to a User's Pieces collection." });
};
