var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
let async = require('async');
//var Utilisateur = require('../models/utilisateur.js');
var sanitizeHtml = require('sanitize-html');
let bcrypt = require('bcryptjs');

router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', function(req, res, next) {
  res.render('pages/inscription', {});
  next();
});

router.post('/inscription', (req, res)=>{

let mail = sanitizeHtml(req.body.email);
let pseudo = sanitizeHtml(req.body.pseudo);
let nom = sanitizeHtml(req.body.nom);
let prenom = sanitizeHtml(req.body.prenom);
let pawd = bcrypt.hashSync(req.body.pwd);
let geo = JSON.parse(req.body.geo);

let location = {lat: geo.lat, lon: geo.lon}

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