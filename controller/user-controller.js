'use strict';

/*
 * TODO: use FacebookServiceManager
 */
module.exports = function(app) {
  var fs = require('fs');
  var request = require('request');
  var FB_API_VER = 'v3.2';
  var FB_API_URL = 'https://graph.facebook.com/' + FB_API_VER + '/';

  // ------------------------------------------------------------

  app
    .route('/user/api/signup')
    .post(function(req, res, next) {
      var json  = { 'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'password': req.body.password };

      AuthoringManager.signupByEmail(json, function(err, jwt) {
        if (err) return next(err);
        res.status(200).send({ data: { jwt: jwt }});
      });
    });


  // ------------------------------------------------------------

  app
    .route('/user/api/login')
    .post(function(req, res, next) {
      var json  = { 'deviceId': req.body.deviceId,
                    'email': req.body.email,
                    'password': req.body.password,
                    'fbAccessToken': req.body.fbAccessToken };

      AuthoringManager.loginByEmail(json, function(err, jwt) {
        if (err) return next(err);
        res.status(200).send({ data: { jwt: jwt }});
      });
    });

  // ------------------------------------------------------------

  app
    .route('/user/api/loginByFacebook')
    .post(function(req, res, next) {
      var token = req.body.token;
      var path = FB_API_URL + 'me?fields=first_name,last_name,email&access_token=' + token;

      request
        .get({ url: path, json: true }, async (err, response, json) => {
          if (err || !!json.error) {
            next(new Error((json || { error: {}}).error.message || err || 'Facebook Api Error'));

          } else {
            var existing = await Domain.UserProfile.findOne({ where: { email: json.email }});
            var cre = null === existing ? null : await Domain.UserCredential.findOne({ where: { user_id: existing.id }});

            if (null === existing) {
              AuthoringManager.signupByFacebook({ firstName: json.first_name,
                                                  lastName: json.last_name,
                                                  email: json.email,
                                                  token: token },
                                                (err, jwt) => {
                                                  if (err) return next(err);
                                                  res.status(200).send({ data: { jwt: jwt }});
                                                });
            } else {
              await cre.setAccessToken(token).save();
              res.status(200).send({ data: { jwt: cre.jwt }});
            }
          }
        });

    });

  // ------------------------------------------------------------

  /* using device_id as email */
  app
    .route('/user/api/loginByGuest')
    .post(async function(req, res, next) {
      var deviceId = req.body.deviceId;
      var existing = await Domain.UserProfile.findOne({ where: { email: deviceId }});
      var cre = await Domain.UserCredential.forUser(existing);

      if (null === existing) {
        AuthoringManager.signupByGuest({ firstName: 'Guest',
                                         lastName: 'Guest',
                                         email: deviceId },
                                       (err, jwt) => {
                                         if (err) return next(err);
                                         res.status(200).send({ data: { jwt: jwt }});
                                       });
      } else {
        res.status(200).send({ data: { jwt: cre.jwt }});
      }
    });

  // ------------------------------------------------------------

  app
    .route('/user/api/come')
    .post(app.apiRequiredLogin, (req, res, next) => {
      res.status(200).send({ data: { msg: 'Hello World! ' + req.user.first_name }});
    });

  // ------------------------------------------------------------


};
