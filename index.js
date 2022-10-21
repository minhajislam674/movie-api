const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('common')); // Using Morgan’s “common” format, it logs basic data such as IP address, the time of the request etc.


let topMovies = [
    {
        title: 'The Lord of the Rings',
        director: 'Peter Jackson'
    },
    {
        title: 'Harry Potter',
        director: 'David Yates'
    },
    {
        title: 'The Dark Knight',
        director: 'Christopher Nolan'
    },
    {
        title: 'Schindlers List',
        director: 'Steven Spielberg'
    },
    {
        title: 'Inception',
        director: 'Christopher Nolan'
    },
    {
        title: 'Forrest Gump',
        director: 'Robert Zemeckis'
    },
    {
        title: 'The Matrix',
        director: 'The Wachowskis'
    },
    {
        title: 'Raiders of the Lost Ark',
        director: 'Steven Spielberg'
    },

];


// Routes all requests for static files to their corresponding files within the “public” folder in the server

app.use(express.static('public'))


// Error-handling middleware function

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


// Get requests: app.METHOD(PATH, HANDLER)

app.get('/movies', (req, res) => {
    res.json(topMovies);
});


app.get('/', (req, res) => {
    res.send('Welcome to myFlix app');
});


// Listens for requests

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.'); //a logic here to send a response
});
