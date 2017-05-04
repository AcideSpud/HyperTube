var mongoose = require("mongoose");

var User_Schema = new mongoose.Schema({
  			username : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
  			nom : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
  			prenom : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
  			langue: String,
  			pwd : String,
  			mail : String,
  			date : { type : Date, default : Date.now }
});


var UserModel = mongoose.model('NewUser', User_Schema);

module.exports = {
  UserModel: UserModel
}