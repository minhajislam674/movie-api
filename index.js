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
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com']; // Set the application to allow requests from these origins
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policiy for this app does not allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

let auth = require('./auth')(app); //import our “auth.js” file into the project. 'app' argument ensures that Express is available in our “auth.js” file as well.
const passport = require('passport'); //require the Passport module
require('./passport'); //import our “passport.js” file into the project.

app.use(morgan('common')); // Using Morgan’s “common” format. It logs basic data such as IP address, the time of the request etc.

app.use(express.static('public')) // Routes all requests for static files to their corresponding files within the “public” folder in the server

// CREATE -- Add new user
app.post(
    '/users',
    //Here include validator as middleware to the routes that require validation. It takes the following format:
    //check([field in req.body to validate], [error message if validation fails]).[validation method]();
    [
        check('Username', 'Username is required').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email is not valid').isEmail()
    ], 
    (req, res) => {
        // check the validation object for errors
        let errors = validationResult(req); ////Puts any errors that occurred into a new variabl

        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()}); //Error sent back to the user in a JSON object as an HTTP response. If an error occurs here, the rest of the code will not execute.
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


// UPDATE -- Change a user's info, by username
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
                Password: hashedPassowrd,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }}, 
        { new: true})
        .then ((updatedUser) => {
            res.json(updatedUser)
        })
        .catch ((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// CREATE -- Allow user to add a movie to favoriteMovies array
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }) // This line makes sure that the updated document is returned
    .then ((updatedUser) => {
        res.json(updatedUser)
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE -- Allow user to delete a movie from favoriteMovies array
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
       $pull: { FavoriteMovies: req.params.MovieID }
     },
     { new: true }) // This line makes sure that the updated document is returned
      .then ((updatedUser) => {
          res.json(updatedUser)
      })
      .catch ((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
  });

// DELETE -- Allow user deregister
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

// READ -- Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});





// READ -- Get all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// READ -- Get movies based on title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne( { Title: req.params.Title })
    .then((movie) => {

        if(movie) {
            res.json(movie)
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
        } else {
            res.status(400).send('no such movie');
        };
    });
});

// READ -- Get data about a genre (description) by genre name
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

// READ -- Get data about director by name
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

