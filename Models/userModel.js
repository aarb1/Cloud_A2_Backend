const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/cloudDatabase');

var userSchema = new Schema({
    username: String,
    password: String
})

var userModel = mongoose.model('userModel', userSchema);

module.exports = userModel;