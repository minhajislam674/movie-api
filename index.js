const mongoose = require('mongoose'); //Integrating Mongoose into this REST API wgich will allow to perform CRUD operations on our MongoDB data
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

//Connect to MongoDB database (local)
//mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

//Connect to MongoDB database (online)
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const {check, validationResult} = require('express-validator'); //This express-validator library offers a variety of validation methods

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app); //import our “auth.js” file into the project. 'app' argument ensures that Express is available in our “auth.js” file as well.
const passport = require('passport'); //require the Passport module
require('./passport'); //import our “passport.js” file into the project.

app.use(morgan('common')); // Using Morgan’s “common” format. It logs basic data such as IP address, the time of the request etc.

app.use(express.static('public')) // Routes all requests for static files to their corresponding files within the “public” folder in the server


// Welcome message
/**
 * GET welcome message from '/' endpoint
 * @method getWelcomeMessage
 * @param {string} endpoint to fetch welcome page
 * @returns {string} Welcome message
 */

app.get('/', (req, res) => {
    res.send('Welcome to OscarFlics API!');
});


//Incorporate swagger openAPI documentation
const swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger.json');
app.use(
    '/documentation',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);


// Register user

/**
 * @method registerUser
 * @param {string} endpoint to register user
 * @param {array} validates input using express-validator
 * @param {function} callback to check if user already exists
 * @returns {object} that creates user in database
 */

app.post(
    '/users',
    //Here include validator as middleware to the routes that require validation. It takes the following format:
    [
        check('Username', 'Username is required').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email is not valid').isEmail()
    ], 
    (req, res) => {
        let errors = validationResult(req); 

        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()}); 
        }

    let hashedPassowrd = Users.hashPassword(req.body.Password); //Hash any password entered by the user when registering before storing it in the MongoDB database
    Users.findOne({Username: req.body.Username}) //Search to see if a user with the requested username already exists
    .then((user)=> { 
        if (user) { //If the user is found, send a response that it already exists
            return res.status(400).send(req.body.Username + 'already exists'); 
        } else { //If the user doesn’t exist, you use Mongoose’s create command to “CREATE” the new user
            Users.create({
                Username: req.body.Username,  //req.body is the request that the user sends.
                Password: hashedPassowrd,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user)=> {res.status(201).json(user)} )
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error:' + error);
            })
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error:' + error);
    });
});


// Change a user's info, by username

/**
 * @method UpdateUser
 * @param {string} endpoint to update user info
 * @param {function} authentication method using passport
 * @param {array} validation using express validator
 * @param {function} callback to to find user and update their profile data
 * @returns {object} updated user object
 */

app.put(
    '/users/:Username', 
    passport.authenticate('jwt', { session: false }),

    [
        check('Username', 'Username is required').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email is not valid').isEmail()
    ],
    (req, res) => {
        // check the validation object for errors
        let errors = validationResult(req); ////Puts any errors that occurred into a new variable

        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()}); //Error sent back to the user in a JSON object as an HTTP response. If an error occurs here, the rest of the code will not execute.
        }
    
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username},
        {$set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }}, 
        { new: true})
        .then ((updatedUser) => {
            res.status(201).json(updatedUser)
        })
        .catch ((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// Add a movie to favoriteMovies array

/**
 * @method AddFavorite
 * @param {string} endpoint to add movie to list of favorites
 * @param {function} authentication method using passport
 * @param {function} callback to find user and update their favorite movies array
 * @returns {object} updated user object
 */

app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }) // This line makes sure that the updated document is returned
    .then ((updatedUser) => {
        res.status(201).json(updatedUser)
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Delete a movie to favoriteMovies array

/**
 * @method RemoveFavorite
 * @param {string} endpoint to delete movie to list of favorites
 * @param {function} authentication method using passport
 * @param {function} callback to find user and update their favorite movies array
 * @returns {object} updated user object
 */

app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
       $pull: { FavoriteMovies: req.params.MovieID }
     },
     { new: true }) // This line makes sure that the updated document is returned
      .then ((updatedUser) => {
          res.status(201).json(updatedUser)
      })
      .catch ((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
  });

// Allow user deregister

/**
 * @method deleteUser
 * @param {string} endpoint to user profile
 * @param {function} authentication method using passport
 * @param {function} callback to find user and remove the object
 * @returns {string} message that confirms the deletion
*/
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
    .then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + ' could not be found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get all users

/**
 * @method getAllUsers
 * @param {string} endpoint to fetch all users
 * @param {function} authentication method using passport
 * @param {function} callback to get a user by username
 * @returns {array} returns list of all users
 */

app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
    .then((users) => {
        res.status(200).json(users);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// Get a single user by username

/**
 * @method getUserByUsername
 * @param {string} endpoint to fetch details about a specific user
 * @param {function} authentication method using passport
 * @param {function} callback to get a user by username
 * @returns {object} returns single user
 */
 
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
    .then((users) => {
        res.status(200).json(users);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});


// Get all movies

/**
 * @method getAllMovies
 * @param {string} endpoint to fetch all movies
 * @param {function} authentication method using passport
 * @param {function} callback to find the list of movies
 * @returns {array} returns an array of objects (movies)
*/

app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(200).json(movies);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// Get movies based on title

/**
 * @method getMovieByTitle
 * @param {string} endpoint to fetch a specific movie
 * @param {function} authentication method using passport
 * @param {function} callback to find a movie by title
 * @returns {object} returns single movie
*/

app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne( { Title: req.params.Title })
    .then((movie) => {

        if(movie) {
            res.status(200).json(movie)
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
        } else {
            res.status(400).send('no such movie');
        };
    });
});

// Get data about a genre (description) by genre name

/**
 * @method getMovieByTitle
 * @param {string} endpoint to fetch a specific movie
 * @param {function} authentication method using passport
 * @param {function} callback to find a movie by title
 * @returns {object} returns object of one movie
*/

app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name})
    .then((genre) => {
        if (genre) {
            res.status(200).json(genre.Genre);
        } else {
            res.status(400).send('no such genre');
        }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

// Get data about director by name

/**
 * @method getDirectorByName
 * @param {string} endpoint to fetch details about a director
 * @param {function} authentication method using passport
 * @param {function} callback to get a director by name
 * @returns {object}  object of one director
 */

app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name})
    .then((director) => {
        if (director) {
            res.status(200).json(director.Director);
        } else {
            res.status(400).send('no such director');
        }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });



// Error-handling middleware function

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Listens for requests
const port = process.env.PORT || 8080;
//process.env.PORT looks for a pre-configured port number in the environment variable, and, if nothing is found, sets the port to a certain port number.
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port); 
});




