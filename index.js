const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

app.use(morgan('common')); // Using Morgan’s “common” format. It logs basic data such as IP address, the time of the request etc.

app.use(express.static('public')) // Routes all requests for static files to their corresponding files within the “public” folder in the server

let users = [
    {
        id: 1,
        name: "Tim",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "Hugo",
        favoriteMovies: ['Harry Potter']
    }

]
let movies = [
    {
        "Title": "The Dark Knight",
        "Description": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        "Genre":{
            "Name": "Action",
            "Description": "Action film is a film genre in which the protagonist is thrust into a series of events that typically involve violence and physical feats."
        },
        
        "Director": {
            "Name": "Christopher Nolan",
            "Bio": "Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director Christopher Nolan was born on July 30, 1970, in London, England. Over the course of 15 years of filmmaking, Nolan has gone from low-budget independent films to working on some of the biggest blockbusters ever made.",
            "Birth": 1947
        }

    },

    {
        "Title": "Forrest Gump",
        "Description": "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.",
        "Genre":{
            "Name": "Drama",
            "Description": "Drama is a mode of fictional representation through dialogue and performance. It is one of the literary genres, which is an imitation of some action. Drama is also a type of play written for theater, television, radio, and film."
        },
        
        "Director": {
            "Name": "Robert Zemeciks",
            "Bio": "A whiz-kid with special effects, Robert is from the Spielberg camp of film-making (Steven Spielberg produced many of his films).",
            "Birth": 1951
        }

    }

];


// CREATE -- Add new user
app.post('/users', (req, res) => {
    const newUser = req.body;

    if(newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser)
    } else {
        res.status(400).send('Users need names')
    }
})

// UPDATE -- Change user name
app.put('/users/:id', (req, res) => {
    const {id} = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user)
    } else {
        res.status(400).send("No such user")
    }
})


// CREATE -- Allow user to add a movie to favoriteMovies array
app.post('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id} array`);
    } else {
        res.status(400).send("No such user")
    }
})

// DELETE -- Allow user to delete a movie from favoriteMovies array
app.delete('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find(user => user.id == id); //checking if the user exists

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !==movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id} array`);
    } else {
        res.status(400).send("No such user")
    }
})

// DELETE -- Allow user deregister
app.delete('/users/:id', (req, res) => {
    const {id} = req.params;

    let user = users.find(user => user.id == id); //checking if the user exists

    if (user) {
        users = users.filter(user => user.id != id);
        // res.json(users)
        res.status(200).send(`User ${id} has been removed.`);
    } else {
        res.status(400).send("No such user")
    }
})


// READ -- Get all movies
app.get('/movies', (req, res) => {
    res.status(200).send('Successful GET request returning data on all the students');
})

// READ -- Get movies based on title
app.get('/movies/:title', (req, res) => {
    const {title} = req.params;
    const movie = movies.find(movie => movie.Title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('no such movie')
    }
})

// READ -- Get only movie genre
app.get('/movies/genre/:genreName', (req, res) => {
    const {genreName} = req.params;
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('no such genre')
    }
})

// READ -- Get data about director by name
app.get('/movies/director/:directorName', (req, res) => {
    const {directorName} = req.params;
    const director = movies.find(movie => movie.Director.Name === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('no such director')
    }
})



// Error-handling middleware function

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Listens for requests

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.'); //a logic here to send a response
});

