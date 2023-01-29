# OscarFlicks - API

> This web application implements a RESTful API to perform CRUD operations on different Academy Award winning films, directors, and genres. Users will be able to sign up, update their personal information, and create a list of their favorite movies.

API Endpoints: https://myflix-movies.onrender.com/documentation/

Frontend live demo: https://myflix-movies.onrender.com/documentation/

## Key Features

- Return a list of all movies
- Return (description, genre, director, image URL, whether it is featured or not) about a single movie by title to the user
- Return data about a genre (description and movies) by name (e.g., “Thriller”)
- Return data about a director (bio, birth year, death year. and movies) by name
- Allow new users to register
- Allow users to update their user info (username, password, email, date of birth)
- Allow users to add a movie to their list of favorites
- Allow users to remove a movie from their list of favorites
- Allow existing users to deregister

## Built with

- Node.js
- Express
- Mongoose
- MongoDB

## Dependencies

- bcrypt
- body-parser
- cors
- express
- express-validator
- jsonwebtoken
- mongoose
- passport
