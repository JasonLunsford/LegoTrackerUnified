const { authJwt } = require('../middleware');
const controller = require('../controllers/pieces.controller');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get('/api/pieces', [authJwt.verifyToken, authJwt.isAdmin], controller.allPieces);

    app.get('/api/pieces/:id', [authJwt.verifyToken, authJwt.isAdmin], controller.singlePiece);

    app.post('/api/pieces', [authJwt.verifyToken, authJwt.isAdmin], controller.savePiece);
};
