var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: false }));

//MODEL
var UserModel = require("../models/userModel.js").UserModel;
var CommentModel = require("../models/CommentModel.js").CommentModel;
//

router.post('/datas', function(req, res) {
	console.log(req.body)
	// res.end()
	// res.redirect('/watch', {movie: req.body.movie})
  	res.render('pages/watch', {movie: req.body.movie, title: req.body.title});
});

router.get('/', function(req, res) {
  	res.render('pages/watch', {movie: req.body.movie, title: req.body.title});
});


module.exports = router