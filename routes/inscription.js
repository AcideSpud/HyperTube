var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
let async = require('async');
//var Utilisateur = require('../models/utilisateur.js');
var sanitizeHtml = require('sanitize-html');
let bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', function(req, res, next) {
  res.render('pages/inscription', {});
  next();
});

router.post('/inscription', (req, res)=>{

let mail = sanitizeHtml(req.body.email);
let pseudo = sanitizeHtml(req.body.pseudo);
//let nom = sanitizeHtml(req.body.nom);
//let prenom = sanitizeHtml(req.body.prenom);
let pawd = bcrypt.hashSync(req.body.pwd);
let geo = JSON.parse(req.body.geo);

let location = {lat: geo.lat, lon: geo.lon}

var User_Schema = new mongoose.Schema({
  			username : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
  			pwd : String,
  			date : { type : Date, default : Date.now }
});

console.log('//////User_Schema/////')

console.log(User_Schema);

var UserModel = mongoose.model('NewUser', User_Schema)

var NewUser = new UserModel({ username : pseudo, pwd : pawd});

console.log('///////NEWUSER//////');
console.log(NewUser);

NewUser.save(function (err) {
  if (err) { throw err; }
  console.log('Commentaire ajouté avec succès !');
  // On se déconnecte de MongoDB maintenant
  mongoose.connection.close();
});

UserModel.find({ username: 'coucou' }, function (err, comms) {
  if (err) { throw err; }
  // comms est un tableau de hash
  console.log(comms);
});


/*let user = {email: mail,
			pseudo: pseudo,
			nom: nom,
			prenom: prenom,
			pwd: pawd,
			geo: location,
			pop: 0,
			like: [],
			liker: [],
			visit: [],
			visiter: [],
			img:[]};

async.waterfall([
	function(callback){
		Utilisateur.queryByMail(mail, (query, err)=>{
			if (err) return callback(err);
				return callback(null, query);
		});
	},
	function(mail, callback){
		Utilisateur.queryByPseudo(pseudo, (query, err)=>{
			if (err) return callback(err)
			return callback(null, mail, query);
		})
	},
	function(mail, pseudo, callback){
		if (mail.length)
			return callback('Dsl quelqu utilijse ce mail');
		else if (pseudo.length)
			return callback('Dsl quelqu utilise ce pseudo')

		else{
			Utilisateur.insertUser(user, (resu, err)=>{
				if (err) return callback(err);
				return callback(null, 'TU es enregistre');
			})
		}
	}
	], (err, resultFinal)=>{
		if (err) return res.status(200).send(err);
		else return res.status(200).send(resultFinal);
	});

*/

})

module.exports = router;