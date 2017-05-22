var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
var torrentStream = require('torrent-stream');
var path = require('path');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var ffprobe = require('ffprobe');
var pump = require('pump')
var Video = require('../models/movie');

router.use(bodyParser.urlencoded({ extended: false }));

//MODEL
var UserModel = require("../models/userModel.js").UserModel;
var CommentModel = require("../models/CommentModel.js").CommentModel;
//

function requireLogin (req, res, next) {
    if (!req.user) {
        res.redirect('/');
    } else {
        next();
    }
};


router.get('/', requireLogin, (req, res)=> {
    UserModel.find({username : req.session.user.username}, (err, user)=>{
        if (err){
            console.log(err)
        }
        res.render('pages/watch', {movie: req.body.movie, title: req.body.title, user: user});
        next();
    })
    
});


router.post('/datas', (req, res)=> {
	console.log(req.body)
	// res.end()
	// res.redirect('/watch', {movie: req.body.movie})
  	res.render('pages/watch', {movie: req.body.movie, title: req.body.title});
});
router.get('/bob', (req, res)=> {
    res.render('pages/video');
    res.end();
});
router.get('/boby', (req, res)=>{
    //Video.mp4Read(res);
    var mLink = 'magnet:?xt=urn:btih:c7382becd8c4e7e5324a5164f54c9c41328fa65a&dn=Vengeance+A+Love+Story+%282017%29+%5BYTS.AG%5D';
    Video.justMp4Stream(mLink, res).then(()=>{
        console.log(`Everything ok `);
    }).catch((err)=>{
        console.log(err);
    });
});

router.get('/run', (req, res)=> {
    var mLink = 'magnet:?xt=urn:btih:c7382becd8c4e7e5324a5164f54c9c41328fa65a&dn=Vengeance+A+Love+Story+%282017%29+%5BYTS.AG%5D';
    var test = Video.getDownInfo(mLink);
    var retStream;

    test.then((info) => {
        lsize = 0;
        fs.access(`./public/${info[0].name}`, (err) => {

            if (!err) {
                console.error('myfile already exists');
                let stat = fs.statSync(`./public/${info[0].name}`)

                lsize = stat.size;
            }


            if (err || (lsize != info[0].size)) {
                console.log(lsize);
                fs.access(`./public/${info[0].name}`, (err) => {
                    if (!err) {
                        console.error('myfile already exists');
                        fs.unlink(`./public/${info[0].name}`);
                        return;
                    }
                    if (info[0].name.endsWith('.mp4')) {
                        console.log('yop');
                        var boby = Video.streamMp4(mLink);
                        boby.then((stream) => {
                            console.log('Do IT BITCH ! ' + stream);
                            var fstream = fs.createReadStream('./public/' + stream)
                                .on('open', () => {
                                    console.log(`Beginning READ Mp4 file`);
                                    pump(fstream, res);
                                })
                                .on('error', (err) => {
                                    console.log(`ERR : ${err}`);
                                    res.end();

                                });
                            fstream.on('end', () => {
                                console.log(`End of Stream `);
                            });
                        });
                        boby.catch((err) => {
                            console.log(`ERR : ${err}`);
                        });
                    }
                    else if (info[0].name.endsWith('.mkv') || info[0].name.endsWith('.avi')) {
                        retStream = Video.getDownFile(mLink);
                        retStream.then((stream) => {
                            console.log(`RUN STREAM`);
                            pump(stream, res);
                        }).catch((err) => {
                            console.log(`getDownInfo have fail somewhere ${err}`);
                        });
                    }
                    else {
                        res.end();
                    }
                });

            }
            else {
            console.log('Alredy exist lets run !');
            Video.mp4Read(res, info[0].name);
            }

        });
    });
    test.catch((str)=>{
        console.log(str);
    });



});



module.exports = router;