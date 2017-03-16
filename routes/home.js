var express = require('express');
var router = express.Router();


router.get('/', function(req, res) {
		res.render('pages/home', {});
	});

router.get('/test', (req, res)=> {
    console.log('test');
    res.end();
})
module.exports = router