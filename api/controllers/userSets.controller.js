const template = require('url-template');
const _ = require('lodash');

const db = require('../models');
const apiBase = require('../config/api.config');

const Sets = db.sets;
const User = db.user;
const UserSets = db.userSets;
const UserPieces = db.userPieces;

const BrickOwlCatalogUrl = template.parse('/catalog/{action}{?key,type,brand,id,boid,boids}');
const RebrickSetsUrl = template.parse('/sets/{setNumber}/{?key}');
const RebrickSetPiecesUrl = template.parse('/sets/{setNumber}/parts{?key}');
const RebrickThemesUrl = template.parse('/themes/{id}/{?key}');

const attachOne = setNumber => {
    if (setNumber.includes('-1')) return setNumber;

    return `${setNumber}-1`;
};

const findBaseNumber = setNumber => {
    if (setNumber.includes('-')) {
        const pos = setNumber.indexOf('-');

        return setNumber.slice(0, pos);
    }

    return setNumber;
};

exports.allUserSets = async (req, res) => {
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const userSets = await UserSets.find({userId: currentUser._id });
    const masterSets = await Sets.find();

    const setsData = [];

    userSets.forEach(userSet => {
        masterSets.forEach(masterSet => {
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
        res.status(204).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    const masterSet = await Sets.findOne({baseSetNumber: req.params.id});

    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const userSets = await UserSets.find(query);

    if (!masterSet) {
        res.status(503).send({ message: "Set not in master database." });

        return;
    }

    if (!userSets.length) {
        res.status(204).send({ message: "User does not own this set.", data: [] });

        return;
    }

    const userSet = {
        baseSetNumber: masterSet.baseSetNumber,
        imgUrl:        masterSet.imgUrl,
        name:          masterSet.name,
        pieceCount:    masterSet.pieceCount,
        pieces:        masterSet.pieces,
        price:         masterSet.price,
        pricePaid:     userSets[0].pricePaid,
        theme:         masterSet.theme,
        year:          masterSet.year,
        notes:         userSets[0].notes
    }

    res.status(200).send({ data: userSet });
};

exports.piecesFilteredBySet = async (req, res) => {
    const currentUser = await User.findOne({ accessToken: req.header.accessToken });

    res.status(200).send({ message: "Will return pieces filtered by a specific Set." });
};

exports.saveUserSet = async (req, res) => {
    if (!req.body.setNumber) {
        res.status(204).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    const currentUser = await User.findOne({ accessToken: req.header.accessToken });
    let masterSet = await Sets.findOne({ baseSetNumber: req.body.setNumber });

    if (!masterSet) {
        const masterSetData = {
            baseSetNumber: req.body.setNumber,
            pieces:        []
        };

        const boBoidResult = await apiBase.brickOwlV1.get(
            BrickOwlCatalogUrl.expand({
                key:    process.env.BRICK_OWL_API_KEY,
                action: 'id_lookup',
                id:     req.body.setNumber,
                type:   'Set'
            })
        );
        const boid = _.get(boBoidResult, 'data.boids[0]', '');

        if (_.isEmpty(boid)) {
            res.status(503).send({ message: 'Cannot identify set.' });

            return;
        }

        const boSetDataResult = await apiBase.brickOwlV1.get(
            BrickOwlCatalogUrl.expand({
                key:    process.env.BRICK_OWL_API_KEY,
                action: 'lookup',
                boid,
                type:   'Set'
            })
        );

        masterSetData.boid = boid;
        masterSetData.price = _.get(boSetDataResult, 'data.cheapest_gbp');

        const rebrickSetData = await apiBase.rebrickV3.get(
            RebrickSetsUrl.expand({
                key:       process.env.REBRICKABLE_API_KEY,
                setNumber: attachOne(req.body.setNumber)
            })
        );

        masterSetData.pieceCount = _.get(rebrickSetData, 'data.num_parts', 0);
        masterSetData.year = _.get(rebrickSetData, 'data.year');
        masterSetData.name = _.get(rebrickSetData, 'data.name');
        masterSetData.imgUrl = _.get(rebrickSetData, 'data.set_img_url');

        const rebrickThemeData = await apiBase.rebrickV3.get(
            RebrickThemesUrl.expand({
                key: process.env.REBRICKABLE_API_KEY,
                id:  rebrickSetData.data.theme_id
            })
        );
        masterSetData.theme = _.get(rebrickThemeData, 'data.name');

        const set = new Sets(masterSetData);
        await set.save();

        masterSet = await Sets.findOne({ baseSetNumber: req.body.setNumber });
    }

    const query = {
        $and : [
            { userId: currentUser._id },
            { masterSetId: masterSet._id }
        ]
    };

    const userSet = await UserSets.find(query);
    if (!userSet.length) {
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

    res.status(204).send({ message: 'Set already entered.', data: [] });
};
