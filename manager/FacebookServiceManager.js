class FacebookServiceManager {
  var API_VER = 'v3.2';
  var API_URI = 'https://graph.facebook.com/' + API_VER + '/';

  constructor() { /* ... */ }
  
}

class FacebookParams {
  var params = {};
  
  constructor() { /* ... */ }

  setParam(key, value) {
    this.params[key] = value;
    return this;
  }

  getParams() {
    var path = '';
    for (var k in params) {
      path += ('&' + key + '=' + params[k]);
    }
    return 0 < path.lenght ? ('?' + path.slice(1)) : path;
  }
}


var FSM = FacebookServiceManager;
FSM.FacebookParams = FacebookParams;

module.exports = FSM;
