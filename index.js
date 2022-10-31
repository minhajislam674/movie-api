const mongoose = require('mongoose'); //Integrating Mongoose into this REST API wgich will allow to perform CRUD operations on our MongoDB data
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

//Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('common')); // Using Morgan’s “common” format. It logs basic data such as IP address, the time of the request etc.

app.use(express.static('public')) // Routes all requests for static files to their corresponding files within the “public” folder in the server

// CREATE -- Add new user
app.post('/users', (req, res) => {
    Users.findOne({Username: req.body.Username})
    .then((user)=> { 
        if (user) { //If the given username does exist, send back the appropriate response to the client 
            return res.status(400).send(req.body.Username + 'already exists'); 
        } else { //If the user doesn’t exist, you use Mongoose’s create command to “CREATE” the new user
            Users.create({
                Username: req.body.Username,  //req.body is the request that the user sends.
                Password: req.body.Password,
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
app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username},
        {$set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
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
app.post('/users/:Username/movies/:MovieID', (req, res) => {
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
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
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
app.delete('/users/:Username', (req, res) => {
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
app.get('/users', (req, res) => {
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
app.get('/movies', (req, res) => {
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
app.get('/movies/:Title', (req, res) => {
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
app.get('/movies/genres/:Name', (req, res) => {
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
app.get('/movies/directors/:Name', (req, res) => {
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

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.'); //a logic here to send a response
});

