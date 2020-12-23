const template = require('url-template');
const _ = require('lodash');

const db = require('../models');
const apiBase = require('../config/api.config');

const helper = require('./helper');

const Sets = db.sets;
const Pieces = db.pieces;
const User = db.user;
const UserSets = db.userSets;
const UserPieces = db.userPieces;

const RebrickSetPiecesUrl = template.parse('/sets/{setNumber}/parts{?key}');

const attachOne = setNumber => {
    if (setNumber.includes('-1')) return setNumber;

    return `${setNumber}-1`;
};

exports.updateUserSet = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    if (_.isEmpty(req.body) || _.isEmpty(req.body.notes) || _.isEmpty(req.body.pricePaid)) {
        res.status(200).send({ message: "Missing PUT data.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.params.id);

    // Need to grab current user by JWT and master set by baseSetNumber because we need those
    // mongoDb IDs
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const masterSet = await Sets.findOne({ baseSetNumber });

    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const targetSet = await UserSets.find(query);

    // Set not found, bail...
    if (!targetSet.length) {
        res.status(200).send({ message: "Set not found in User's collection.", data: [] });

        return;
    }

    // Update user set data - this mean we need BOTH notes AND price paid each time the user PUTs
    await UserSets.findByIdAndUpdate(targetSet[0]._id, {notes: req.body.notes, pricePaid: req.body.pricePaid}, (err, item) => {
        if (err) {
            res.status(503).send({ message: err });

            return;
        }

        res.status(200).send({ message: `Set number ${req.params.id} updated successfully.`, data: [] });
    });
};

exports.deleteUserSet = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.params.id);

    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const masterSet = await Sets.findOne({ baseSetNumber });

    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const targetSet = await UserSets.find(query);

    if (!targetSet.length) {
        res.status(200).send({ message: "Set not found in User's collection.", data: [] });

        return;
    }

    await UserSets.findByIdAndDelete(targetSet[0]._id, (err, item) => {
        if (err) {
            res.status(503).send({ message: err });

            return;
        }

        res.status(200).send({ message: `Set number ${req.params.id} deleted successfully.`, data: [] });
    });
};

exports.allUserSets = async (req, res) => {
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const userSets = await UserSets.find({userId: currentUser._id });
    const masterSets = await Sets.find();

    const setsData = [];

    // This is a very expensive way to go about merging data from Master Sets and User Sets.
    // Note to self: figure out a cheaper way to do this
    userSets.forEach(userSet => {
        masterSets.forEach(masterSet => {
            // Need to coerce these props into strings so we can evaluate them properly
            if (String(userSet.masterSetId) === String(masterSet._id)) {
                setsData.push({
                    baseSetNumber: masterSet.baseSetNumber,
                    imgUrl:        masterSet.imgUrl,
                    name:          masterSet.name,
                    pieceCount:    masterSet.pieceCount,
                    pieces:        masterSet.pieces,
                    price:         masterSet.price,
                    pricePaid:     userSet.pricePaid,
                    theme:         masterSet.theme,
                    year:          masterSet.year,
                    notes:         userSet.notes
                });
            }
        });
    });

    res.status(200).send({ data: setsData });
};

exports.singleUserSet = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.params.id);

    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const masterSet = await Sets.findOne({ baseSetNumber });

    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const targetSet = await UserSets.find(query);

    if (!masterSet) {
        res.status(503).send({ message: "Set not in master database." });

        return;
    }

    if (!targetSet.length) {
        res.status(200).send({ message: "User does not own this set.", data: [] });

        return;
    }

    const userSet = {
        baseSetNumber: masterSet.baseSetNumber,
        imgUrl:        masterSet.imgUrl,
        name:          masterSet.name,
        pieceCount:    masterSet.pieceCount,
        pieces:        masterSet.pieces,
        price:         masterSet.price,
        pricePaid:     targetSet[0].pricePaid,
        theme:         masterSet.theme,
        year:          masterSet.year,
        notes:         targetSet[0].notes
    }

    res.status(200).send({ data: userSet });
};

exports.piecesFilteredBySet = async (req, res) => {
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });

    res.status(200).send({ message: "Will return pieces filtered by a specific Set." });
};

exports.saveUserSet = async (req, res) => {
    if (!req.body.setNumber) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.body.setNumber);

    // Find current user by their current JWT token
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });

    // Grab Set details from Master Set collection
    let masterSet = await Sets.findOne({ baseSetNumber });

    // No Set found in Master Set? Okay - let's add it
    if (!masterSet) {
        // Attempt to save Master Set
        const savedState = await helper.addMasterSet(baseSetNumber);

        // addMasterSet returns data only on success, so if data is missing we know there was a problem
        if (!savedState.data) {
            res.status(200).send({ message: savedState.err });

            return;
        }

        // NOW we have a set in Master Set, so let's grab it
        masterSet = await Sets.findOne({ baseSetNumber });
    }

    const rebrickPieceData = await apiBase.rebrickV3.get(
        RebrickSetPiecesUrl.expand({
            key:       process.env.REBRICKABLE_API_KEY,
            setNumber: attachOne(baseSetNumber)
        })
    );
    const rawRebrickPieces = _.get(rebrickPieceData, 'data.results');
    const piecesData = [];

    // Grab all pieces from the Master Pieces collection
    const MasterPieces = await Pieces.find();

    for (let i = 0; i < rawRebrickPieces.length; i++) {
        const rebrickPartNum = _.get(rawRebrickPieces[i], 'part.part_num', '');
        const masterPiece = MasterPieces.find(piece => piece.rebrickPartNum === rebrickPartNum);

        piecesData.push({
            masterPieceId: masterPiece._id,
            userId:        currentUser._id,
            count:         _.get(rawRebrickPieces[i], 'quantity', 0) || 0,
            pricePaid:     0,
            notes:         ''
        });
    }

    // Grab all pieces from the User Pieces collection
    const userPiecesData = await UserPieces.find({ userId: currentUser._id });

    if (userPiecesData.length) {
        // Loop thru the pieces data and user pieces collection to either update the piece count
        // in the user's piece collection, or save the new piece into the user's piece collection

        // THIS CODE IS GENERATING CRAZY DUPLICATES - FIND THE DEFECT AND FIX
        for (let i = 0; i < piecesData.length; i++) {
            for (let j = 0; j < userPiecesData.length; j++) {
                if (piecesData[i].masterPieceId === userPiecesData[j].masterPieceId) {
                    const count = userPiecesData[j].count + piecesData[i].count;

                    await UserPieces.findByIdAndUpdate(userPiecesData[j]._id, {count});
                } else {
                    const newPiece = new UserPieces({ ...piecesData[i] });

                    await newPiece.save();
                }
            }
        }
    } else {
        for (let i = 0; i < piecesData.length; i++) {
            const newPiece = new UserPieces({ ...piecesData[i] });

            await newPiece.save();
        }
    }

    // Construct a simple query where we need both userId AND masterSetId
    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const userSet = await UserSets.find(query);

    // "Find" always returns an array, no results means an empty array
    if (!userSet.length) {
        // User should have provided the price they paid and any notes about the set
        const userSetData = {
            notes:       req.body.notes,
            pricePaid:   req.body.pricePaid,
            userId:      currentUser._id,
            masterSetId: masterSet._id
        }

        const userSet = new UserSets(userSetData);
        await userSet.save((err, item) => {
            if (err) {
                res.status(503).send({ message: err });

                return;
            }

            res.status(200).send({ message: `Set ${req.body.setNumber} saved successfully.`, data: userSetData });
        });

        return;
    }

    res.status(200).send({ message: 'Set already entered.', data: [] });
};
