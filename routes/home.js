var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');

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
		res.render('pages/home', {user: user.username});
		next();
	})
 });

router.get('/test', (req, res)=> {
    console.log('test');
    res.end();
})

module.exports = router