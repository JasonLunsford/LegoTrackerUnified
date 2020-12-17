const { authJwt } = require('../middleware');
const controller = require('../controllers/sets.controller');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get('/api/sets', [authJwt.verifyToken, authJwt.isAdmin], controller.allSets);

    app.get('/api/sets/:id', [authJwt.verifyToken, authJwt.isAdmin], controller.singleSet);

    app.post('/api/sets', [authJwt.verifyToken, authJwt.isAdmin], controller.saveSet);
};
