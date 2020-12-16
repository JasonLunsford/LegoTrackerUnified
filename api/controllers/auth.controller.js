const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config/auth.config');
const db = require('../models');

const User = db.user;
const Role = db.role;

const DEFAULT_EXPIRE = 86400; // 24 hours

exports.signup = async (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username
  })
  .populate("roles", "-__v")
  .exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    let passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    let token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: DEFAULT_EXPIRE
    });

    let authorities = [];

    for (let i = 0; i < user.roles.length; i++) {
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
    }

    User.findByIdAndUpdate(
      user._id,
      {
        accessToken: token
      },
      {
        useFindAndModify: false
      }
    )
    .exec();

    res.status(200).send({
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token
    });
  });
};

exports.signout = (req, res) => {
  User.findOne({
    username: req.body.username
  })
  .exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    User.findByIdAndUpdate(
      user._id,
      {
        accessToken: ''
      },
      {
        useFindAndModify: false
      }
    )
    .exec();

    res.status(200).send({status: 200, message: 'Signed Out'});
  });
};
