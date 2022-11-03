const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy, //two Passport strategies are defined: LocalStrategy and JWTStrategy 
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;


//Setting up the LocalStrategy
passport.use(new LocalStrategy ({ //LocalStrategy takes a username and password from the request body
    usernameField: 'Username',
    passwordField: 'Password'
}, 
(username, password, callback) => {
    console.log(username + '  ' + password);
    Users.findOne({Username: username}) //uses Mongoose to check our database for a user with the same username
    .then((user) => {
        if (!user) {
            console.log('incorrect username');
            return callback(null, false, {message: 'Incorrect username.'});
        }

        //Hash any password entered by the user when logging in before comparing it to the password stored in MongoDB 
        //(user.validatePassword(password)) in LocalStrategy within your “passport.js” file).

        if (!user.validatePassword(password)) {
            console.log('incorrect password');
            return callback(null, false, {message: 'Incorrect passowrd.'});
        } 

        console.log('finished');
        return callback(null, user, {message: 'Logged In Successfully'});
    })
    .catch((error) => {
        console.log(error);
        return callback(error)
    });
}));

//Setting up the JWT authentication code
passport.use(new JWTStrategy ({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), //JWT is extracted from the header of the HTTP request. This JWT is called the “bearer token”.
    secretOrKey: 'your_jwt_secret' //Use of a “secret” key to verify the signature of the JWT.
}, (jwtPayload, callback) => {
    return Users.findById(jwtPayload._id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((error) => {
        return callback(error);
    });
}));