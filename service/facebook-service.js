
var request = require('request');


var _FB_API_VER = 'v3.2';
var _FB_API_URI = 'https://graph.facebook.com/' + _FB_API_VER + '/';

class FacebookService {
  constructor() { /* ... */ }

  get(path, params, token, callback) {
    request
      .get({ url: _FB_API_URI + path + params.setParam('access_token', token).toString(), json: true }, async (err, response, json) => {
        if (err || !!json.error) {
          callback(new Error((json || { error: {}}).error.message || err || 'Facebook Api Error'));

        } else {
          callback(null, json);
        }
      });
  }
}

class Params {
  constructor() {
    this.params = {};
  }

  setParam(key, value) {
    this.params[key] = value;
    return this;
  }

  toString() {
    var path = '';
    for (var k in this.params) {
      path += ('&' + k + '=' + this.params[k]);
    }
    return 0 < path.length ? ('?' + path.slice(1)) : path;
  }
}


var service = FacebookService;
service.Params = Params;

module.exports = service;
