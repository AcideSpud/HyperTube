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


      function getMovieDatas (torrentDatas, i) {
        var parsedDatas = tnp(torrentDatas[i].name)
        imdb.get(parsedDatas.title)
          .then(movieDatas => {
              torrentDatas[i].movieDatas = movieDatas
              i++
              if (i < torrentDatas.length) {
                getMovieDatas(torrentDatas, i)
              }
              else {
                io.to(data.id).emit('browseFilmsList', {filmsList: torrentDatas})
              }
          })
          .catch(err => {
            console.log(err)
            i++
            if (i < torrentDatas.length) {
              getMovieDatas(torrentDatas, i)
            }
          })
      }
      
      var i = 0
      PirateBay
          .topTorrents(201)
          .then(filmsList => {   
            getMovieDatas(filmsList, i)
          })
          .catch(err => console.log(err))
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
