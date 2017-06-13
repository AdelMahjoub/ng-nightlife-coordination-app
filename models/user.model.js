const db        = require('../services/db.service');
const validator = require('validator');             // https://github.com/chriso/validator.js
const bcrypt    = require('bcrypt')                 // https://www.npmjs.com/package/bcrypt

const UserSchema = db.Schema({
  email: {
    type: String,
    validate: [
      {
        validator: function(value) {
          return validator.isEmail(value);
        },
        msg: 'Not a valid email.'
      },
      {
        isAsync: true,
        validator: function(value, respond) {
          User.findOne({email: value}, (err, user) => {
            if(err) {
              console.log('Unexpected error while validating email: ' + err)
              return respond(false);
            }
            else {
              respond(!Boolean(user));
            }
          });
        },
        msg: 'This email is already in use.'
      }
    ]
  },
  password: {
    type: String,
    validate: {
      validator: function(value) {
        return value.length >= 6;
      },
      msg: 'Password should have at least 6 characters.'
    }
  },
  destinations: [{type: String}]
});

/**
 * Mongoose pre save middleware on User
 * Bcrypt user password
 */
UserSchema.pre('save', function(next) {
  let user = this;
  if(!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, function(err, salt) {
    if(err) return next();
    bcrypt.hash(user.password, salt, function(err, hashed) {
      if(err) return next();
      user.password = hashed;
      return next();
    });
  });
});

/**
 * User compare password method
 */
UserSchema.methods.comparePasswords = function(guess, password, callback) {
  bcrypt.compare(guess, password, function(err, isMatch) {
    return callback(err, isMatch);
  });
}

const User = db.model('User', UserSchema);

module.exports = User;