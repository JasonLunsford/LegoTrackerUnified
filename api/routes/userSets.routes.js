const { authJwt } = require('../middleware');
const controller = require('../controllers/userSets.controller');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get('/api/user/sets', [authJwt.verifyToken], controller.allUserSets);

    app.get('/api/user/sets/:id', [authJwt.verifyToken], controller.singleUserSet);

    app.get('/api/user/sets/:id/pieces', [authJwt.verifyToken], controller.piecesFilteredBySet);

    app.post('/api/user/sets', [authJwt.verifyToken], controller.saveUserSet);

    app.put('/api/user/sets/:id', [authJwt.verifyToken], controller.updateUserSet);

    app.delete('/api/user/sets/:id', [authJwt.verifyToken], controller.deleteUserSet);
};
