var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
let async = require('async');
//var Utilisateur = require('../models/utilisateur.js');
var sanitizeHtml = require('sanitize-html');
let bcrypt = require('bcryptjs');
let nodemailer = require('nodemailer');

var UserModel = require("../models/userModel.js").UserModel;


router.use(bodyParser.urlencoded({ extended: false }));

String.prototype.shuffle = function (){
	 var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

function requireLogin (req, res, next) {
    if (!req.user) {
        res.redirect('/connexion');
    } else {
        next();
    }
};

router.get('/', function(req, res, next) {
	console.log('///////////////////REQ.DB/////////////')
	console.log(req.db);
	console.log('///////////////////////////////')
  res.render('pages/connexion', {});
  next();
});

router.post('/connexion', (req, res)=>{

let email = sanitizeHtml(req.body.email);
let pwd = req.body.pwd;

console.log('email: ', email, 'pwd: ', pwd);



async.waterfall([
	function findUser(callback){
		if (email.match(/[@]/))
			UserModel.find({mail : email}, (err, UserByMail)=>{
				if (err) return callback(err);
				console.log('USERBYMAIL:', UserByMail)
				return callback(null, UserByMail);
			});
		else
			UserModel.find({username : email}, (err, UserByPseudo)=>{
			if (err) return callback(err)
			console.log('USERBYPSEUDO: ',UserByPseudo);
			return callback(null, UserByPseudo);
		})
	},
	function RegisterUser(user, callback){
		if (user && user[0]){
			if (bcrypt.compareSync(pwd, user[0].pwd)){
				req.session.user = user[0];
				console.log('REGISTER USER: REQ>SESSION>USER: ', req.session.user.username)
				return callback(null, 'Vous etes bien authentifié')
			} else return callback('un mauvais mdp')
		} else return callback('mauvais pseudo ou email/')
		
	}
	], (err, resultFinal)=>{
		if (err) return res.status(200).send(err);
		else return res.status(200).send(resultFinal);
	});

});



router.post('/frgt_pwd', (req, res)=>{

	let email = sanitizeHtml(req.body.email);

	/*async.waterfall([
		function findUser(callback){
			Utilisateur.queryByMail(email, (UserByMail, err)=>{
				if (err) return callback(err);
				console.log('USERBYMAIL:', UserByMail)
				return callback(null, UserByMail);
			});
		},
		function changePwd(user, callback){
			if (user && user[0])

				Utilisateur.changePwd(user[0].pseudo, null, (newpass, err)=>{
					return callback(null, newpass, user);
				})
			else return callback('l\'utilisateur n\'existe pas');
		},
		function sendMail(newpass, user, callback){


			var transporter = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user:'matcha42matcha@gmail.com',
						pass:'projetmatcha42'
					}
				})

				var textLink = "http://" + req.headers.host;

				var mailOptions ={
					from: 'Matcha 42 <matcha42matcha@gmail.com>',
					to: user[0].email,
					subject: 'forgot mdp',
					generateTextFromHTML: true,
					html:'<p>votre nouveau pwd: </p></br>' + newpass + '</br><a href=\"'+ textLink.toString() + '\"> </br>Click here to activate your account.</a>'
				}

				transporter.sendMail(mailOptions, (err, info)=>{
					if (err)
						return callback('prob with email transporter system');
					else return callback(null, 'Le Mail a bien ete envoyé');
				})

		}
		], (err, resultFinal)=>{
			if (err) return res.status(200).send(err);
			else return res.status(200).send(resultFinal);
		});
		*/

})

router.get('/logout', requireLogin, (req, res)=>{

	req.session.destroy((err)=> {
            if (err) {
             throw err
            }
            else {
            	console.log('coucou2')
                res.redirect('/')
            }
         });
        
})


module.exports = router;