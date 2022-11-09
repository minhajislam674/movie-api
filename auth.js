//Authentication Logic
const jwtSecret = 'your_jwt_secret'; // This is the the same key used in the JWTStrategy

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport'); // Local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // This is the username we’re encoding in the JWT
        expiresIn: '7d', //This specifies that the token will expire in 7 days
        algorithm: 'HS256'  // This is the algorithm used to “sign” or encode the values of the JWT
    });
}

//login action

module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false}, (error, user, info) => { //local specifies the local strategy we defined to check that the username and password in the body of the request exist in the database.
            if (error || !user) {
                return res.status(404).json({ //If the username and password don’t exist, you return the error message 
                    message: 'Invalid username or password',  
                    user: user
                });
            }
            req.login(user,  {session: false}, (error) => {
                if(error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON()); //uses generateJWTToken() function to create a JWT based on the username and password
                return res.json({ user, token});
            });
        }) (req, res);
    });
}