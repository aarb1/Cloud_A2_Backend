const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://10.0.1.7:20000/cloudDatabase');

var userSchema = new Schema({
    username: String,
    password: String
})

var userModel = mongoose.model('userModel', userSchema);

module.exports = userModel;
