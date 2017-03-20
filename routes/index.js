var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    console.log(req.db);
    res.render('pages/index', {});
});

module.exports = router;
