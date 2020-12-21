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

const findBaseNumber = setNumber => {
    if (setNumber.includes('-')) {
        const pos = setNumber.indexOf('-');

        return setNumber.slice(0, pos);
    }

    return setNumber;
};

exports.allSets = async (req, res) => {
    const sets = await Sets.find();

    res.status(200).send({ data: sets });
};

exports.singleSet = async (req, res) => {
    if (!req.params.id) {
        res.status(204).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    const query = {
        $or : [
            { boid: req.params.id },
            { baseSetNumber: findBaseNumber(req.params.id) }
        ]
    };

    const set = await Sets.find(query);

    res.status(200).send({ data: set });
};

exports.saveSet = async (req, res) => {
    if (!req.body.setNumber) {
        res.status(204).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    const query = {
        $or : [
            { baseSetNumber: findBaseNumber(req.body.setNumber) },
        ]
    };

    const setTest = await Sets.find(query);

    if (setTest.length) {
        res.status(204).send({ message: "Set already entered.", data: [] });

        return;
    }

    const setData = {
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

    setData.boid = boid;
    setData.price = _.get(boSetDataResult, 'data.cheapest_gbp');

    const rebrickSetData = await apiBase.rebrickV3.get(
        RebrickSetsUrl.expand({
            key:       process.env.REBRICKABLE_API_KEY,
            setNumber: attachOne(req.body.setNumber)
        })
    );

    setData.pieceCount = _.get(rebrickSetData, 'data.num_parts', 0);
    setData.year = _.get(rebrickSetData, 'data.year');
    setData.name = _.get(rebrickSetData, 'data.name');
    setData.imgUrl = _.get(rebrickSetData, 'data.set_img_url');

    const rebrickThemeData = await apiBase.rebrickV3.get(
        RebrickThemesUrl.expand({
            key: process.env.REBRICKABLE_API_KEY,
            id:  rebrickSetData.data.theme_id
        })
    );
    setData.theme = _.get(rebrickThemeData, 'data.name');

    const set = new Sets(setData);

    set.save((err, item) => {
        if (err) {
            res.status(503).send({ message: err });

            return;
        }

        res.status(200).send({ message: `Set ${req.body.setNumber} saved successfully.`, data: setData });
    });
};
