'use strict';

var crypto = require('crypto');
var bcrypt    = require('bcrypt-nodejs');
var JWT       = require('jsonwebtoken');

function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function encode(text) {
  var cipher = crypto.createCipher(Config.auth.algorithm, Config.auth.secret)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decode(text) {
  var decipher = crypto.createDecipher(Config.auth.algorithm, Config.auth.secret)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

// ------------------------------------------------------------

module.exports = class AuthoringService {
  constructor() { /* ... */ }

  async signupByEmail(json, callback) {
    var existingUser = await Domain.UserProfile.findOne({ where: { email: json.email.toLowerCase() }, raw: true });

    if (null != existingUser) {
      callback(new Error('The email has been taken.'), null);

    } else {
      Domain.UserProfile
        .create({ first_name: json.firstName,
                  last_name: json.lastName,
                  email: json.email.toLowerCase(),
                  status_bit: 1,
                  role: 'member' })
        .then(user => Domain.UserCredential.create({ user_id: user.id,
                                                     jwt: JWT.sign(user.get({ plain: true }), Config.auth.secret),
                                                     password_hash: generateHash(json.password) }))
        .then(cred => callback(null, cred.jwt))
        .catch(err => callback(new Error('signup failed', 100), null));
    }
  }

  signupByFacebook(json, callback) {
    Domain.UserProfile
      .create({ first_name: json.firstName,
                last_name: json.lastName,
                email: json.email.toLowerCase(),
                status_bit: 1,
                role: 'member' })
      .then(user => Domain.UserCredential.create({ user_id: user.id,
                                                   jwt: JWT.sign(user.get({ plain: true }), Config.auth.secret),
                                                   access_token_encode: encode(json.token),
                                                   access_token_type: 1 }))
      .then(cred => callback(null, cred.jwt))
      .catch(err => callback(new Error('signup failed', 100), null))
        }

  signupByGuest(json, callback) {
    Domain.UserProfile
      .create({ first_name: json.firstName,
                last_name: json.lastName,
                email: json.email.toLowerCase(),
                device_id: json.email.toLowerCase(),
                status_bit: 1,
                role: 'guest' })
      .then(user => Domain.UserCredential.create({ user_id: user.id,
                                                   jwt: JWT.sign(user.get({ plain: true }), Config.auth.secret) }))
      .then(cred => callback(null, cred.jwt))
      .catch(err => callback(new Error('signup failed'), null));
  }

  async loginByEmail(json, callback) {
    var user = await Domain.UserProfile.findOne({ where: { email: json.email.toLowerCase() }, raw: true });
    var credential = null === user ? null : await Domain.UserCredential.findOne({ where: { user_id: user.id }});

    if (null === user || null === credential) {
      /* --- User not found */
      callback(new Error('The email or password you entered is incorrect.'), null);

    } else if (null != json.password && credential.validPassword(json.password)) {
      /* --- User Found With Correct Password */
      callback(null, credential.jwt);

    } else {
      /* --- User Found With Incorrect Password */
      callback(new Error('Incorrect Password'), null);
    }
  }

  async getUserCredentialForUser(user) {
    return null === user ? null : await Domain.UserCredential.findOne({ where: { user_id: user.id }});
  }

  verifyToken(jwt, callback) { /* callback(err, decodedUser) */
    var ERR = new Error("Invalid User");

    JWT.verify(jwt, Config.auth.secret, (e, u) => {
      Domain
        .UserProfile
        .findOne({ where: { id: u ? u.id : null }})
        .then(user => callback(user ? null : ERR, user))
        .catch(callback);
    });
  }

  encode(val) {
    return encode(val);
  }

  comparePasswordHash(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}
