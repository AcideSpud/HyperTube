var LocalStrategy = require('passport-local').Strategy;

var configAuth = require('./auth');

var UserModel = require("../models/userModel.js").UserModel;

module.exports = function(passport){

	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		UserModel.find({username : req.session.user.username}, (err, user)=>{
		done(err, user);
	})

	/*passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done){
		process.nextTick(function(){
			User.findOne({'local.email': email}, function(err, user){
				if (err)
					return done(err);
				if (user){
					return done(null, false, req.flash('signupMessage', 'That email already token'));
				} else {
					var newUser = new User();
					newUser.local.email = email;
					newUser.local.password = password;

					newUser.save(function(err){
						if (err)
							throw err;
						return done(null, newUser);
					})
				}
			});
		});
	}
	)) */

	passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, cb) {
  		process.nextTick(function(){
  			User.findOne({'facebook.id': profile.id}, function(err, user){
  				if (err)
  					return done(err);
  				if (user)
  					return done(null, user);
  				else{
  					var newUser = new UserModel();
  					newUser.facebook.id = profile.id;
  					newUser.facebook.token = accessToken;
  					newUser.facebook.name = profile.name.given + ' ' + profile.name.familyName;
  					newUser.facebook.email = profile.emails[0];

  					newUser.save(function(err){
  						if (err)
  							throw err;
  						return done(null, newUser);
  					})
  				}
  			});
  		})
  }
));

};