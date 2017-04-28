var https = require('https');
var request = require('request');
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

    UserModel.find({username : req.session.user.username}, (err, result)=>{
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

  socket.on('getDatSort', (data) => {

    function firstRow(sortedList) {
      var j = 0
      var k = 0
      var length = sortedList.length
      while ((j < length) && (k < 8)) {
        if (sortedList[j] && sortedList[j].movieDatas && (sortedList[j].movieDatas.poster.slice(0, 4) == "http") && ((j === 0) || (sortedList[j].movieDatas.title != sortedList[j - 1].movieDatas.title))) {
          io.to(data.id).emit('browseFilmsList', {filmsList: sortedList[j]})
          k++
        }
        j++
      }
    }

    var getTitleAscSort = new Promise((resolve, reject) => {
      socket.filmsList.sort()
      console.log("in getTitleAscSort: "+socket.filmsList[0].title)
      resolve(socket.filmsList)
      if (!socket.filmsList) {
        reject('socket.filmsList vide!')
      }
    })

    var getTitleDescSort = new Promise((resolve, reject) => {
      socket.filmsList.reverse()
      console.log("in getTitleDescSort: "+socket.filmsList[0].title)
      resolve(socket.filmsList)
      if (!socket.filmsList) {
        reject('socket.filmsList vide!')
      }
    })

    console.log(data)

    if (data.sort == "title-asc") {
      getTitleAscSort.then((filmsList) => {
        console.log("after getTitleAscSort: "+socket.filmsList[0].title)
        firstRow(socket.filmsList)
      })
      .catch(err => console.log(err))
    }
    else if (data.sort == "title-desc") {
       getTitleDescSort.then((filmsList) => {
        console.log("after getTitleDescSort: "+socket.filmsList[0].title)
        firstRow(socket.filmsList)
      })
      .catch(err => console.log(err))
    }

    // io.to(data.id).emit('setUpdate', {filmsList: socket.filmsList})
  })
    
  socket.on('getMoreFilms', (data) => {
    console.log("ENCORE!")

    var k = 0
    var j = socket.filmsIndex
    while ((j < socket.filmsListLength) && (k < 4)) {
      if (socket.filmsList[j] && socket.filmsList[j].movieDatas && (socket.filmsList[j].movieDatas.poster.slice(0, 4) == "http") && (socket.filmsList[j].movieDatas.title != socket.filmsList[j - 1].movieDatas.title)) {
        io.to(data.id).emit('browseFilmsList', {filmsList: socket.filmsList[j]})
        k++
      }
      j++
    }
    socket.filmsIndex = j
  })


  socket.on('getFilmsList', function(data) {

    // Initialisation des variables
    if (data.title) {
      var title = htmlspecialchars(data.title)
      console.log("\nTITRE DEMANDÉ: "+title+"\n")
    }
    socket.filmsIndex = 8
    socket.filmsList = []
    socket.filmsListLength = 0
    var list = []


    // Les fonctions
    function sortList(filmsList, callback){
      for (var m = 0; m < (filmsList.length - 1); m++) {
        for (var n = (filmsList.length - 1); n; n--) {
          if (filmsList[m].title > filmsList[m + 1].title) {
            var temp = filmsList[m]
            filmsList[m] = filmsList[m + 1]
            filmsList[m + 1] = temp
            temp = ''
            m = 0
          }
          if (filmsList[n].title < filmsList[n - 1].title) {
            var temp2 = filmsList[n]
            filmsList[n] = filmsList[n - 1]
            filmsList[n - 1] = temp2
            temp2 = ''
            n = (filmsList.length - 1)
          }
        }
      }
      if (m == (filmsList.length - 1) && (!n)) {
        return (callback(filmsList))
      }
    }
    
    function firstRow(sortedList) {
      var j = 0
      var k = 0
      var length = sortedList.length
      while ((j < length) && (k < 8)) {
        if (sortedList[j] && sortedList[j].movieDatas && (sortedList[j].movieDatas.poster.slice(0, 4) == "http") && ((j === 0) || (sortedList[j].movieDatas.title != sortedList[j - 1].movieDatas.title))) {
          io.to(data.id).emit('browseFilmsList', {filmsList: sortedList[j]})
          k++
        }
        j++
      }
    }

    function getIMDbDatas(title, film) {
      return new Promise((resolve, reject) => {
        imdb.get(title)
          .then(movieDatas => {
            film.movieDatas = movieDatas
              resolve(film)
          })
          .catch(err => {
            reject("ERR IMDB: "+err.message)
          })
      })
    }

    function inList(list, title) {
      return new Promise((resolve, reject) => {
        if ((list.indexOf(title)) != -1) {
          reject("film en doublon: "+title)
        }
        else {
          resolve('ok')
        }
      })
    } 

    
    function getMovieDatas (filmsList, i, list) {
      inList(list, filmsList[i].title).then((ret) => {
        if (ret == 'ok') {
          console.log(socket.filmsList.length+" "+filmsList[i].title)
          list.push(filmsList[i].title)
          getIMDbDatas(filmsList[i].title, filmsList[i]).then((film) => {
            if (film.movieDatas && (film.movieDatas.poster.slice(0, 4) == "http")) {
              if (!socket.filmsListLength) {
                socket.filmsList[0] = film
                socket.filmsListLength = 1
              }
              else {
                socket.filmsListLength = socket.filmsListLength + 1  
                socket.filmsList.push(film)
              }
              if (((socket.filmsListLength <= 8) && (!filmsList[i + 1])) || (socket.filmsListLength == 8)) {
                firstRow(socket.filmsList)
              }
            }
            i++
            if (i < filmsList.length) {
              getMovieDatas(filmsList, i, list)
            }
          })
          .catch(err => {
            console.log(err)
            i++
            if (i < filmsList.length) {
              getMovieDatas(filmsList, i, list)
            }
          })
        }
      })
      .catch((err) => {
        console.log(err)
        i++
        if (i < filmsList.length) {
          getMovieDatas(filmsList, i, list)
        }
      })
    }


    function getTitles(list, filmsList, i) {
      var filmsListLength = filmsList.length
      return new Promise((resolve, reject) => {
        if (filmsList[i].name) {
          var parsedDatas = tnp(filmsList[i].name)
          filmsList[i].title = parsedDatas.title
        }
        else if (filmsList[i].title) {
          var parsedDatas = tnp(filmsList[i].title)
          filmsList[i].title = parsedDatas.title
        }
        if (filmsList[i].title == '') {
          reject("erreur tnp")
        }
        i++
        if (i < filmsListLength) {            
          resolve(i)
          getTitles(list, filmsList, i).then((length) => {
            if (length == (filmsList.length - 1)) {
              sortList(filmsList, (filmsList) => {
                var x = 0
                getMovieDatas(filmsList, x, list)
              })
            }
          })
        }
      })
    }

    // Les promesses de recherche de sources
    var getSecondSource = new Promise((resolve, reject) => {
      var filmsList = []
      for (var i = 1; i < 3; i++) {
        if (title) {
          request('https://yts.ag/api/v2/list_movies.json?sort=like_count&query_term='+title+'&page='+i+'&limit=50', (err, response, body) => {
            if (err){
              reject(err); 
            }
            var filmsList2 = JSON.parse(body);
            if (filmsList2.data.movies) {
              for (var j = 0, len = filmsList2.data.movies.length; j < len; j++) {
                filmsList.push(filmsList2.data.movies[j])
              }
            }
          });
        }
        else {
          request('https://yts.ag/api/v2/list_movies.json?sort=like_count&page='+i+'&limit=50', (err, response, body) => {
            if (err){
              reject(err); 
            }
            var filmsList2 = JSON.parse(body);
            if (filmsList2.data.movies) {
              for (var j = 0, len = filmsList2.data.movies.length; j < len; j++) {
                filmsList.push(filmsList2.data.movies[j])
              }
            }
          });
        }
      }
      if (i == 3) {
          resolve(filmsList)
      }
    })

    var getFirstSource = new Promise((resolve, reject) => {
      if (title) {
        PirateBay.search(title, {
          category: 201,
          orderBy: 'leeches',
          sortBy: 'desc'
        })
        .then(filmsList => {
          if (filmsList[0]) {
            resolve(filmsList)
          }
          else {
            var tab = []
            resolve(tab)
          }
        })
        .catch(err => reject(err))
      }
      else {
        PirateBay
        .topTorrents(201)
        .then(filmsList => {
          if (filmsList[0]) {
            resolve(filmsList)
          }
          else {
            var tab = []
            resolve(tab)
          }
        })
        .catch(err => reject(err))
      }
    })

    // Le script principal
    getFirstSource.then((filmsList) => {
      getSecondSource.then((filmsList2) => {
        filmsList = filmsList.concat(filmsList2)

        console.log("\nLISTE PIRATEBAY + YTS: ")
        for (var a = 0; a < filmsList.length; a++) {
          if (filmsList[a].title) {
            console.log(filmsList[a].title)
          }
          else if(filmsList[a].name) {
            console.log(filmsList[a].name)
          }
        }
        console.log("\n")

        var x = 0
        getTitles(list,filmsList, x)
        .catch(err => console.log(err))
      })
      .catch(err => console.log(err))
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
