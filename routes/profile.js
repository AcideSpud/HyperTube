var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
let async = require('async');
var sanitizeHtml = require('sanitize-html');
var bcrypt = require('bcryptjs');
var multer = require('multer');

router.use(bodyParser.urlencoded({ extended: false }));

//MODEL
var UserModel = require("../models/userModel.js").UserModel;
//


function requireLogin (req, res, next) {
	if (!req.user) {
		console.log('NOOOPE')
		res.redirect('/');
	} else {
		next();
	}
};

router.get('/', requireLogin, function(req, res, next) {
	console.log(req.session.user.username);
	UserModel.find({username : req.session.user.username}, (err, user)=>{
		if (err){
			console.log(err)
		}
		console.log('/////USER: ', user)
		res.render('pages/profile', {user: user});
		next();
	})
 });



router.post('/email', function(req, res){
	UserModel.findOneAndUpdate( {username: req.session.user.username}, {mail: req.body.email}, {new: true},  (err, result)=>{
		console.log(result)
		if (err) res.status(200).send('une erreur de serveur est intervenue');
		else res.status(200).send('Le mail a bien été modifé');
	})
})
router.post('/pwd', function(req, res){

	UserModel.findOneAndUpdate({username: req.session.user.username}, {pwd: bcrypt.hashSync(req.body.pwd)},  (err, result)=>{
		if (err) res.status(200).send('une erreur de serveur est intervenue');
		else res.status(200).send('Le Mot de Passe à bien été modifé');
	})
})
router.post('/nom', function(req, res){
	UserModel.findOneAndUpdate({username: req.session.user.username}, {nom: req.body.nom, prenom: req.body.prenom},  (err, result)=>{
		if (err) res.status(200).send('une erreur de serveur est intervenue');
		else res.status(200).send('Le Nom et Prenom à bien été modifé');
	})
})

router.post('/langue', function(req, res){
	UserModel.findOneAndUpdate({username: req.session.user.username}, {langue: req.body.langue},  (err, result)=>{
		if (err) res.status(200).send('une erreur de serveur est intervenue');
		else res.status(200).send('La langue à été changée');
	})
})

router.post('/img', (req, res)=>{
	var storage =   multer.diskStorage({
 		destination: function (req, file, callback) {
    		callback(null, './public/img');
  		},
  		filename: function (req, file, callback) {

  			console.log('file', file);
  			if (file.mimetype == 'image/jpeg'){
  				var	path =  file.fieldname + '-' + Date.now() + '.jpg';
  				UserModel.findOneAndUpdate({username: req.session.user.username}, {img: path},  (err, result)=>{
  					if (err)
  						callback(err);
  					else callback(null, path)
  				})
  			} else if (file.mimetype == 'image/png'){
  				var	path = file.fieldname + '-' + Date.now() + '.png';
  				UserModel.findOneAndUpdate({username: req.session.user.username}, {img: path},  (err, result)=>{
  					if (err)
  						callback(err);
  					else callback(null, path)

  				})
  			} else callback('Just Png or Jpg');
  		}
	});

	var upload = multer({ storage : storage}).single('userImg');

	console.log('tupasse?')

	upload(req,res,function(err) {

		if(err) {
			console.log('err', err)
            return res.status(200).end("Error uploading file.");
        }
        console.log('coucou final')
        res.status(200).end("File is uploaded");

    });
})

/*



router.post('/delImg', (req, res)=>{

	Utilisateur.deleteImg(req.session.user.pseudo, req.body.path, (err, result)=>{
		if (err) res.status(200).send("Erreur Interne")
		else res.status(200).send("Bien supprimée")
	})

})

router.post('/changeProfilePic', (req, res)=>{

	Utilisateur.changeProfilePic(req.session.user.pseudo, req.body.path, req.body.i, (err, result)=>{
		if (err) res.status(200).send("Erreur Interne")
		else res.status(200).send("Bien supprimée")
	})

})

*/


module.exports = router;