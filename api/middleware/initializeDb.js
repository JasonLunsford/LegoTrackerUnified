const bcrypt = require('bcryptjs');
const db = require('../models');

const Role = db.role;
const User = db.user;

// initialze roles and users in one shot
exports.initializeDb = async () => {
  let userRole = await new Role({ name: "user" }).save();
  let adminRole = await new Role({ name: "admin" }).save();

  User.estimatedDocumentCount((err, count) => {
    // if there are no errors and no users are found...
    if (!err && count === 0) {
      new User({
        username: "JasonLunsford",
        email:    "miyamota@yahoo.com",
        password: bcrypt.hashSync('secret', 10),
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
        password: bcrypt.hashSync('secret', 10),
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
