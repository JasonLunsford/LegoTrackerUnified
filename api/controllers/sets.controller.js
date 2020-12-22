const db = require('../models');
const helper = require('./helper');

const Sets = db.sets;

exports.allSets = async (req, res) => {
    const sets = await Sets.find();

    res.status(200).send({ data: sets });
};

exports.singleSet = async (req, res) => {
    if (!req.params.id) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.params.id);

    const query = {
        $or : [
            { boid: req.params.id },
            { baseSetNumber }
        ]
    };

    const set = await Sets.find(query);

    res.status(200).send({ data: set });
};

exports.saveSet = async (req, res) => {
    if (!req.body.setNumber) {
        res.status(200).send({ message: "Missing Set Number.", data: [] });

        return;
    }

    // Remove any dashes that may trail the actual set number
    const baseSetNumber = helper.findBaseNumber(req.body.setNumber);

    // Test whether set exists
    const setTest = await Sets.findOne({ baseSetNumber });

    // Set exists, bail
    if (setTest) {
        res.status(200).send({ message: "Set already entered.", data: [] });

        return;
    }

    // Attempt to save Master Set
    const savedState = await helper.addMasterSet(baseSetNumber);

    // Signal to user the outcome of save
    if (savedState.isSaved) {
        res.status(200).send({ message: `Set ${req.body.setNumber} saved successfully.`, data: savedState.data });

        return;
    }

    res.status(503).send({ message: savedState.err });
};
