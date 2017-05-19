var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: false }));

//MODEL
var UserModel = require("../models/userModel.js").UserModel;
//

router.post('/datas', function(req, res) {
	console.log(req.body)
	// res.end()
	// res.redirect('/watch', {movie: req.body.movie})
  	res.render('pages/watch', {movie: req.body.movie});
});

router.get('/', function(req, res) {
  	res.render('pages/watch', {movie: req.body.movie});
});


module.exports = router