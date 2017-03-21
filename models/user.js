class User {

	static	CreateUser(username, callback) {

		var User_Schema = new mongoose.Schema({
  			username : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
  			pwd : String,
  			date : { type : Date, default : Date.now }
		});


	}

	static	queryByMail(mail, callback) {


	}


}

module.exports User;