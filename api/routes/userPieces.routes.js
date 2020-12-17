const { authJwt } = require('../middleware');
const controller = require('../controllers/userPieces.controller');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get('/api/user/pieces', [authJwt.verifyToken], controller.allUserPieces);

    app.get('/api/user/pieces/:id', [authJwt.verifyToken], controller.singleUserPiece);

    app.post('/api/user/pieces', [authJwt.verifyToken], controller.saveUserPiece);
};
