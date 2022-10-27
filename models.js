const mongoose = require("mongoose");

//A  schema has been defined for documents in the “Movies” collection
let movieSchema = mongoose.Schema({     
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String
    },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

//A  schema has been defined for documents in the “Users” collection
let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});

//Creation of models that use the schemas we’ve defined. 
let Movie = mongoose.Model('Movie', movieSchema);
let User = mongoose.Model('user', userSchema);


// Exporting the models in order to then import them into your “index.js” file
module.exports.Movie = Movie;
module.exports.User = User;


