const template = require('url-template');
const _ = require('lodash');

const db = require('../models');
const apiBase = require('../config/api.config');

const Sets = db.sets;
const Pieces = db.pieces;

const BrickOwlCatalogUrl = template.parse('/catalog/{action}{?key,type,brand,id,boid,boids}');
const RebrickSetsUrl = template.parse('/sets/{setNumber}/{?key}');
const RebrickSetPiecesUrl = template.parse('/sets/{setNumber}/parts{?key}');
const RebrickThemesUrl = template.parse('/themes/{id}/{?key}');

const attachOne = setNumber => {
    if (setNumber.includes('-1')) return setNumber;

    return `${setNumber}-1`;
};

exports.findBaseNumber = setNumber => {
    if (setNumber.includes('-')) {
        const pos = setNumber.indexOf('-');

        return setNumber.slice(0, pos);
    }

    return setNumber;
};

exports.addMasterSet = async setNumber => {
    // Begin constructing setData
    const setData = {
        baseSetNumber: setNumber,
        pieces:        []
    };

    // Step 1: Find BrickOwl ID (boid) for the set - need boid to get pricing data
    const boBoidResult = await apiBase.brickOwlV1.get(
        BrickOwlCatalogUrl.expand({
            key:    process.env.BRICK_OWL_API_KEY,
            action: 'id_lookup',
            id:     setNumber,
            type:   'Set'
        })
    );
    const boid = _.get(boBoidResult, 'data.boids[0]', '');

    // early bail if no boid (we really need that pricing information)
    if (_.isEmpty(boid)) {
        return {
            isSaved: false,
            err: 'Could not locate set in BrickOwl'
        };
    }

    // Step 2: with boid in hand let's get set data from BrickOwl
    const boSetDataResult = await apiBase.brickOwlV1.get(
        BrickOwlCatalogUrl.expand({
            key:    process.env.BRICK_OWL_API_KEY,
            action: 'lookup',
            boid,
            type:   'Set'
        })
    );

    setData.boid = boid;
    setData.price = _.get(boSetDataResult, 'data.cheapest_gbp');

    // Step 3: Now let's get more useful Set information from Rebrickable
    const rebrickSetData = await apiBase.rebrickV3.get(
        RebrickSetsUrl.expand({
            key:       process.env.REBRICKABLE_API_KEY,
            setNumber: attachOne(setNumber)
        })
    );

    setData.pieceCount = _.get(rebrickSetData, 'data.num_parts', 0);
    setData.year = _.get(rebrickSetData, 'data.year');
    setData.name = _.get(rebrickSetData, 'data.name');
    setData.imgUrl = _.get(rebrickSetData, 'data.set_img_url');

    // Step 3.5: Let's grab the Set theme while we're here...
    const rebrickThemeData = await apiBase.rebrickV3.get(
        RebrickThemesUrl.expand({
            key: process.env.REBRICKABLE_API_KEY,
            id:  rebrickSetData.data.theme_id
        })
    );
    setData.theme = _.get(rebrickThemeData, 'data.name');

    // Step 4: Get the piece data for the Set
    const rebrickPieceData = await apiBase.rebrickV3.get(
        RebrickSetPiecesUrl.expand({
            key:       process.env.REBRICKABLE_API_KEY,
            setNumber: attachOne(setNumber)
        })
    );
    const rawRebrickPieces = _.get(rebrickPieceData, 'data.results');
    const piecesData = [];

    // Step 4.5: Normalize data from Rebrickable into a simple, happy object
    rawRebrickPieces.forEach(piece => {
        piecesData.push({
            elementId:      _.get(piece, 'element_id', 'Unknown') || 'Unknown',
            name:           _.get(piece, 'part.name', ''),
            imgUrl:         _.get(piece, 'part.part_img_url', ''),
            boid:           _.get(piece, 'part.external_ids.BrickOwl[0]', ''),
            color:          _.get(piece, 'color.name', ''),
            rebrickPartNum: _.get(piece, 'part.part_num', ''),
        });
    });

    // Grab all pieces from the Master Pieces collection
    const MasterPieces = await Pieces.find();
    const newPieces = [];

    // Loop thru each piece belonging to the Set, if piece does not exist in Master Pieces collection
    // push it into the newPieces collection, otherwise grab the mongoDb document ID and push that
    // into the setData.pieces collection.
    piecesData.forEach(piece => {
        const masterPiece = MasterPieces.find(item => item.rebrickPartNum === piece.rebrickPartNum);

        if (!masterPiece) {
            newPieces.push(piece);
        } else {
            setData.pieces.push(masterPiece._id);
        }
    });

    // Push all new pieces into the Master Pieces collection....
    await Pieces.insertMany(newPieces);

    // ... and then find each of those pieces and grab the new mongoDb document ID...
    for (let i = 0; i < newPieces.length; i++) {
        const target = await Pieces.find({elementId: newPieces[i].elementId});

        // ...and push it into setData's piece collection
        setData.pieces.push(target[0]._id);
    }

    // instantiate a new set
    const set = new Sets(setData);

    // and save it
    const saveResult = await set.save();

    if (saveResult && saveResult.baseSetNumber && saveResult.baseSetNumber === setNumber) {
        return {
            isSaved: true,
            data: saveResult,
            err: ''
        }
    }

    return {
        isSaved: false,
        err: 'Set was not saved.'
    }
};
