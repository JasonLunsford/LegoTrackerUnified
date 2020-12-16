const bcrypt = require('bcryptjs');
const db = require('../models');

const Role = db.role;
const User = db.user;

// initialze roles and users in one shot
exports.initializeDb = async () => {
  let userRole, adminRole, roleCount = 0;

    roleCount = await Role.estimatedDocumentCount();

    if (roleCount === 0) {
        userRole = await new Role({ name: "user" }).save();
        adminRole = await new Role({ name: "admin" }).save();

        console.log("User and Admin Roles Created Successfully.");
    } else {
        userRole = await Role.findOne({ name: "user" });
        adminRole = await Role.findOne({ name: "admin" });
    }

    User.estimatedDocumentCount((err, count) => {
        // if there are no errors and no users are found...
        if (!err && count === 0) {
            new User({
                username: "JasonLunsford",
                email:    "miyamota@yahoo.com",
                password: bcrypt.hashSync('secret69', 8),
                roles:    [userRole._id, adminRole._id]
            }).save(err => {
                if (err) {
                    console.log("Error registering user: ", err);

                    return;
                }

                console.log("Added 'JasonLunsford' to users collection.");
            })

            new User({
                username: "TrianKoutoufaris",
                email:    "thirtyleaves@gmail.com",
                password: bcrypt.hashSync('secret69', 8),
                roles:    [userRole._id, adminRole._id]
            }).save(err => {
                if (err) {
                    console.log("Error registering user: ", err);

                    return;
                }

                console.log("Added 'TrianKoutoufaris' to users collection.");
            });
        }
    });
};
