const template = require('url-template');
const _ = require('lodash');

const db = require('../models');
const apiBase = require('../config/api.config');

const Sets = db.sets;
const Pieces = db.pieces;

const BrickOwlCatalogUrl = template.parse('/catalog/{action}{?key,type,brand,id,boid,boids}');
const RebrickSetsUrl = template.parse('/sets/{setNumber}/{?key}');
const RebrickSetPiecesUrl = template.parse('/sets/{setNumber}/parts{?key,page}');
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
    setData.price = _.get(boSetDataResult, 'data.cheapest_gbp') || '0';

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
    // Collection we'll pour results into as each recursive step is completed
    let allRebrickPieces = [];

    // Delay method to introduce an arbitrary delay into an async recursive function
    const delay = t => {
        return new Promise(resolve => {
            setTimeout(resolve, t);
        });
    }

    // Recursively collect all pieces associated with a given set
    const getRebrickPieces = async (page = 1) => {
        const rebrickPieceData = await apiBase.rebrickV3.get(
            RebrickSetPiecesUrl.expand({
                key:       process.env.REBRICKABLE_API_KEY,
                setNumber: attachOne(setNumber),
                page
            })
        );

        const rawRebrickPieces = _.get(rebrickPieceData, 'data.results', []) || [];
        allRebrickPieces = [...allRebrickPieces, ...rawRebrickPieces];

        const nextPageLink = _.get(rebrickPieceData, 'data.next');

        if (!nextPageLink) {
            return;
        }

        page++;

        // Wait 5 seconds
        await delay(5000);

        return await getRebrickPieces(page);
    }

    await getRebrickPieces();

    // Loop thru the allRebrickPieces collection,normalize data and ensure uniqueness
    const piecesData = [];
    const pieceCounts = [];
    for (let i = 0; i < allRebrickPieces.length; i++) {
        // Lets determine whether this piece is unique by finding all occurances of it
        const occurances = allRebrickPieces.filter(piece => piece.part.part_num === allRebrickPieces[i].part.part_num);

        // Looks like the piece only occurs one time, so...
        if (occurances.length === 1) {
            // Normalized piece data
            piecesData.push({
                elementId:      _.get(allRebrickPieces[i], 'element_id', 'Unknown') || 'Unknown',
                name:           _.get(allRebrickPieces[i], 'part.name', ''),
                imgUrl:         _.get(allRebrickPieces[i], 'part.part_img_url', ''),
                boid:           _.get(allRebrickPieces[i], 'part.external_ids.BrickOwl[0]', ''),
                color:          _.get(allRebrickPieces[i], 'color.name', ''),
                rebrickPartNum: _.get(allRebrickPieces[i], 'part.part_num', ''),
                price:          '0'
            });

            // Count of this particular piece occurance
            pieceCounts.push({
                rebrickPartNum: _.get(allRebrickPieces[i], 'part.part_num', ''),
                count:          _.get(allRebrickPieces[i], 'quantity', 0),
                spareCount:     0
            });
        } else {
            // Have we already injected this version of the piece into piecesData?
            const isADupe = piecesData.find(piece => piece.rebrickPartNum === allRebrickPieces[i].part.part_num);
            // Have we already injected piece count data into piecesCount?
            const isADupeInPieceCounts = pieceCounts.find(piece => piece.rebrickPartNum === allRebrickPieces[i].part.part_num);

            if (!isADupe) {
                piecesData.push({
                    elementId:      _.get(allRebrickPieces[i], 'element_id', 'Unknown') || 'Unknown',
                    name:           _.get(allRebrickPieces[i], 'part.name', ''),
                    imgUrl:         _.get(allRebrickPieces[i], 'part.part_img_url', ''),
                    boid:           _.get(allRebrickPieces[i], 'part.external_ids.BrickOwl[0]', ''),
                    color:          _.get(allRebrickPieces[i], 'color.name', ''),
                    rebrickPartNum: _.get(allRebrickPieces[i], 'part.part_num', ''),
                    price:          '0'
                });
            }

            if (!isADupeInPieceCounts) {
                let entry = {
                    rebrickPartNum: _.get(allRebrickPieces[i], 'part.part_num', ''),
                    count:          0,
                    spareCount:     0
                };

                // Making a huge assumption here...that occurances only has two members
                // one for the "spare" and one for the regular version (of the piece)
                occurances.forEach(occurance => {
                    if (occurance.is_spare) {
                        entry.spareCount = occurance.quantity;
                    } else {
                        entry.count = occurance.quantity;
                    }
                });

                pieceCounts.push(entry);
            }
        }
    }

    // Grab all pieces from the Master Pieces collection
    const MasterPieces = await Pieces.find();

    // Loop thru each piece belonging to the Set, if piece does not exist in Master Pieces collection
    // save it immediately, otherwise grab the mongoDb document ID and push that
    // into the setData.pieces collection.
    for (let i = 0; i < piecesData.length; i++) {
        const masterPiece = MasterPieces.find(item => item.rebrickPartNum === piecesData[i].rebrickPartNum);
        const counts = pieceCounts.find(item => item.rebrickPartNum === piecesData[i].rebrickPartNum) || {};

        // No masterPiece? Then save it, find it, and use that document ID
        if (!masterPiece) {
            const newPiece = new Pieces({ ...piecesData[i] });
            await newPiece.save();

            const savedPiece = await Pieces.findOne({ rebrickPartNum: piecesData[i].rebrickPartNum });

            setData.pieces.push({
                id: savedPiece._id,
                count: counts.count,
                spareCount: counts.spareCount
            });
        } else {
            setData.pieces.push({
                id: masterPiece._id,
                count: counts.count,
                spareCount: counts.spareCount
            });
        }
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
