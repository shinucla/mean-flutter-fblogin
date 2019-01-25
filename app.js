// to run
// sudo PORT=4545 NODE_ENV=production node app.js


/* ------------ TODOs ------------------
 * 1) [ ] Separate model logic from model:
 *    . create a manage class handling model logic: login's, signup's
 *    . unless it is model dal related: getter, setter, forUser, forId...
 *    . AuthManager:
 *       - crud: user_profile, user_credential
 *       - login, signup, verify, validate, oauth
 *
 * 2) [y] Figure out how to rollback middleware transaction if exception is thrown
 *    Issue: With the cls setup to handle transaction in the middleware, I was hoping the commit and rollback shall be handled automatically.
 *           But it is not. so I have to setup on finish to check if transaction is already "finished" and then do the commit accordingly.
 *           I also have to setup a callback function "onTransactionError" to handle rollback; it will be invoked in the controller. (less ideal!)
 *           It will really be cool if we can check error in the middleware from res and then call rollback.
 *
 *           Another thing regarding the middleware transaction is that you should not call Model.sync() anywhere in the transaction logic.
 *           otherwise, your model instances might be committed unwillingly!!! For example, in the controller post endpoint for signup,
 *           we have two sequential model creations: create user_profile, then create user_credential. However, in the credential model definition,
 *           I have this code:
 *           UserCredential.createForPassword = function(user, password) {
 *             UserCredential
 *               .sync() -------------------------------------------> causing UserProfile instance committed Incorrectly!!
 *               .then(() => UserCredential.create({ ..... });
 *           };
 *           So, the whole transaction logic is like this:
 *
 *             UserProfile.create({...}).then(user => UserCredential.createForPassword(user, pass)).then(.....);
 *
 *           If for some reasons, the credential creation failed after created profile successfully, we shall rollback, and user profile
 *           instance shall be ignored. However, this is not the case, the rollback did not remove profile; this is because of that, as soon
 *           as the ".sync()" is called, the currently transaction will be immediately synced (or persisted)
 *
 *    Resolution: DONT call Model.sync() anywhere in the transaction logic.
 *
 * 3) [ ] Add error handling class
 *      definite conventions for handle output and handle error
 *
 * 4) [ ] API io class:
 *     - output format:             { statusCode: int, result: { data: data, error: error }}
 *     - internal callback format:  callback(err, data)
 *
 * 5) [ ] Error Handler
 *    NO_AUTH, NO_ACCESS, MISSING_PARAMETER, MISSING_DATA, INCORRECT_DATA, ...
 *
 * 6) [ ]
 */


/*
 * Response Conventions:
 *   success:
 *     res.status(200).send({ data: obj,  error: null });
 *
 *   errors:
 *     res.status(400).send({ data: null, error: { code: int, message: string } })
 *     codes:
 *       100: Auth / Permission / Access right related error
 *       200:
 *
 *
 */

//'use strict'; ----------- this will preventing me use global variables

var express           = require('express');
var http              = require('http');
var flash             = require('connect-flash');
var favicon           = require('serve-favicon');
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var session           = require('express-session');

// Global:
Config = require('./config.js');
Domain = require('./domain-models.js')
AuthoringService = new (require('./service/authoring-service'))();

// Config:
Domain.init();
var app = express();
app.locals.pretty = true;
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(express.static(Config.rs_dir)); // public resources: js css img fonts...
app.use(cookieParser());
app.use(session({ secret: 'my_super_secrete_word',
                  resave: false,
                  saveUninitialized: false,
                  //store: new MongoSessionStore({ mongooseConnection: mongoose.connection }),
                  cookie: { maxAge: 180 * 60 * 1000 }
                }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Middlewares
app.use(Domain.TransactionMiddleware);
require('./router.js')(app);
app.use(Domain.TransactionErrorHandlerMiddleware);

http.createServer(app).listen(Config.web.port);  // $sudo PORT=8080 node app.js

console.log('started');

