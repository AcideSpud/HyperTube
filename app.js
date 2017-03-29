var https = require('https');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');


// Les middlewares de l'app
var nodemailer = require('nodemailer');
var moment = require('moment');
var busboy = require('connect-busboy');
var fs = require('fs');
var crypto = require('crypto');
var htmlspecialchars = require('htmlspecialchars');


const ExtraTorrentAPI = require('extratorrent-api').Website;
const extraTorrentAPI = new ExtraTorrentAPI();

// const KAT = require('kat-api-pt'); 
// const kat = new KAT();
var PirateBay = require('thepiratebay');
var tnp = require('torrent-name-parser');
var imdb = require('imdb-api');
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
var passport = require('passport');

//// require ROUTES ! /////
var index = require('./routes/index');
var users = require('./routes/users');
var root = require('./routes/root');
var home = require('./routes/home');
var inscription = require('./routes/inscription');
var connexion = require('./routes/connexion');

//MODEL
var UserModel = require("./models/userModel.js").UserModel;



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


app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use((req, res, next)=>{
  console.log('ahahah');
  if (req.session && req.session.user){
    console.log('regiSTRATOR')

    UserModel.find({username : req.session.user.pseudo}, (err, result)=>{
      if (err){
        console.log(err)
      }else{
        if (result[0])
        {
          req.user = result[0];
          delete req.user.pwd;
          req.session.user = result[0];
          res.locals.user = result[0];

        } else{

        }
        next();
      }
    })
  } else{
    next();
  }
})

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


    socket.on('getMoreFilms', function(data) {
      // console.log("ENCORE!")
      // console.log(socket.filmsIndex)
      // io.to(data.id).emit('browseMoreFilms', {filmsList: socket.filmsIndex})

      for (var i = socket.filmsIndex; i < socket.filmsIndex + 12; i++) {
        if (i < socket.filmsListLength) {
          io.to(data.id).emit('browseFilmsList', {filmsList: socket.filmsList[i]})
        }
      }
      socket.filmsIndex = socket.filmsIndex + 12
    })


    socket.on('getFilmsList', function(data) {


      function getMovieDatas (torrentDatas, i, list) {
        console.log(i)
        if (torrentDatas[i].name) {
          var parsedDatas = tnp(torrentDatas[i].name)
        }
        else {
          var parsedDatas = tnp(torrentDatas[i].title)
        }
        var inList = "n"
        for (var x = 0; x < list.length; x++) {
          if (list[x] == parsedDatas.title) {
            console.log(parsedDatas.title)
            inList = "y"
          }
        }
        if (inList == "n") {
          list.push(parsedDatas.title)
          imdb.get(parsedDatas.title)
            .then(movieDatas => {
                // console.log(torrentDatas[i])
                torrentDatas[i].movieDatas = movieDatas
                if (i < 12) {
                  io.to(data.id).emit('browseFilmsList', {filmsList: torrentDatas[i]})
                }
                i++
                if (i < torrentDatas.length) {
                  getMovieDatas(torrentDatas, i, list)
                }
                if (torrentDatas.page && (torrentDatas.page < torrentDatas.total_pages)) {
                    extraTorrentAPI.search({
                    with_words: 'hd',
                    page: torrentDatas.page + 1,
                    seeds_from: 100,
                    category: 'movies',
                    added: 7,
                  }).then(filmsList => {
                      // console.log(filmsList)
                      var j = 0
                      getMovieDatas(filmsList.results, j, list)
                    })
                    .catch(err => console.error(err));
                }
                else if ((i == torrentDatas.length) || (torrentDatas.page && (torrentDatas.page == torrentDatas.total_pages))){
                  // for (var x = 0; x < socket.filmsIndex; x++) {
                    socket.filmsList = torrentDatas
                    socket.filmsListLength = torrentDatas.length
                    // io.to(data.id).emit('browseFilmsList', {filmsList: torrentDatas[x]})
                  // }
                }
            })
            .catch(err => {
              console.log(err)
              i++
              if (i < torrentDatas.length) {
                getMovieDatas(torrentDatas, i, list)
              }
              if (torrentDatas.page && (torrentDatas.page < torrentDatas.total_pages)) {
                  extraTorrentAPI.search({
                  with_words: 'hd',
                  page: torrentDatas.page + 1,
                  seeds_from: 100,
                  category: 'movies',
                  added: 7,
                }).then(filmsList => {
                    // console.log(filmsList)
                    var j = 0
                    getMovieDatas(filmsList.results, j, list)
                  })
                  .catch(err => console.error(err));
              }
              else if ((i == torrentDatas.length) || (torrentDatas.page && (torrentDatas.page == torrentDatas.total_pages))){
                // for (var x = 0; x < socket.filmsIndex; x++) {
                  socket.filmsList = torrentDatas
                  socket.filmsListLength = torrentDatas.length
                  // io.to(data.id).emit('browseFilmsList', {filmsList: torrentDatas[x]})
                // }
              }
            })
        }
        else {
          i++
          if (i < torrentDatas.length) {
            getMovieDatas(torrentDatas, i, list)
          }
          if (torrentDatas.page && (torrentDatas.page < torrentDatas.total_pages)) {
              extraTorrentAPI.search({
              with_words: 'hd',
              page: torrentDatas.page + 1,
              seeds_from: 100,
              category: 'movies',
              added: 7,
            }).then(filmsList => {
                // console.log(filmsList)
                var j = 0
                getMovieDatas(filmsList.results, j, list)
              })
              .catch(err => console.error(err));
          }
          else if ((i == torrentDatas.length) || (torrentDatas.page && (torrentDatas.page == torrentDatas.total_pages))){
            // for (var x = 0; x < socket.filmsIndex; x++) {
              socket.filmsList = torrentDatas
              socket.filmsListLength = torrentDatas.length
              // io.to(data.id).emit('browseFilmsList', {filmsList: torrentDatas[x]})
            // }
          }
        }
      }

      extraTorrentAPI.search({
        with_words: 'hd',
        page: 1,
        seeds_from: 50,
        leechers_from: 50,
        category: 'movies',
        added: 7
      }).then(filmsList => {
          console.log(filmsList)
          var list = []
          var i = 0
          getMovieDatas(filmsList.results, i, list)
        })
        .catch(err => console.error(err));

        socket.filmsIndex = 12;
        PirateBay
            .topTorrents(201)
            .then(filmsList => {
              var list = []
              var i = 0
              getMovieDatas(filmsList, i, list)
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
