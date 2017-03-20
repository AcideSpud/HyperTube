var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


// Les middlewares de l'app
var nodemailer = require('nodemailer');
var moment = require('moment');
var busboy = require('connect-busboy');
var fs = require('fs');
var crypto = require('crypto');
var htmlspecialchars = require('htmlspecialchars');

var PirateBay = require('thepiratebay');
var tnp = require('torrent-name-parser');
var imdb = require('imdb-api');
var mongoose = require('mongoose');

//// require ROUTES ! /////
var index = require('./routes/index');
var users = require('./routes/users');
var root = require('./routes/root');
var home = require('./routes/home');
var inscription = require('./routes/inscription');
var connexion = require('./routes/connexion');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var server = app.listen(8080);
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db = mongoose.connect('mongodb://localhost/HyperTube', (err)=> {
  if (err) {throw err}
});
/////// LET THIS ABOVE /////
app.use((req, res, next) => {
  req.db = db;
  next();
});
///// THIS ! ///////
app.use('/', index);
app.use('/users', users);
app.use('/home', home);
app.use('/connexion', connexion);
app.use('/inscription', inscription);
app.use('/root', root);

////// ALL TIME :P //////
// catch 404 and forward to error handler

//Le système de navigation via socket
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {

    socket.on('getFilmsList', function(data) {
        // var results = '';
        PirateBay
            .topTorrents(201)
            .then(filmsList => {
                // results = filmsList;
                console.log(filmsList[0])
                var torrentDatas = tnp(filmsList[0].name)
                console.log(torrentDatas)
                imdb.get(torrentDatas.title)
                    .then(movieDatas => {
                        console.log(movieDatas)
                        filmsList[0].movieDatas = movieDatas
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                        console.log(filmsList[0])
                        console.log(filmsList[0].movieDatas.title)

                        // if (i = (filmsList.length - 1)) {
                        // 	io.to(data.id).emit('browseFilmsList', {filmsList: filmsList})
                        // }
                    })
                    .catch(err => console.log(err))

                // for (var i = 0; i < filmsList.length; i++) {
                // }

            })
            .catch(err => console.log(err));
        // movieDB => filmsList[i].movieDB = movieDB


        // .then(filmsList =>

        // 	imdb.getReq({ name: filmsList[0].name })
        // 		.then(console.log)
        // 		.catch(err => console.log(err)));
        // io.to(data.id).emit('browseFilmsList', {filmsList: filmsList});
    });

});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//app.use(function(req, res, next) {
  //  var err = new Error('Not Found');
    //err.status = 404;
    //next(err);
//});


module.exports = app;
