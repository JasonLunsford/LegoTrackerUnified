const mongoose = require('mongoose');
const validator = require('validator');

const User = mongoose.model(
  "User",
  new mongoose.Schema({
      username: {
        type:     String,
        required: true,
        trim:     true
      },
      email: {
        type:      String,
        required:  true,
        unique:    true,
        lowercase: true,
        validate: value => {
          if (!validator.isEmail(value)) {
            throw new Error({error: 'Invalid Email address'})
          }
        }
      },
      password: {
        type:      String,
        required:  true,
        minLength: 8
      },
      accessToken: {
        type:     String,
        required: false
      },
      roles: [
          {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Role"
          }
      ]
  })
);

module.exports = User;
