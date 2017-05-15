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
var profile = require('./routes/profile');
var profileList = require('./routes/profileList');

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
app.use('/profile', profile);
app.use('/profileList', profileList);
app.use('/root', root);

////// ALL TIME :P //////
// catch 404 and forward to error handler


//Le système de navigation via socket
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

  //Les fonctions de triage/fitrage
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

    function sortListByYear(filmsList, callback){
      for (var m = 0; m < (filmsList.length - 1); m++) {
        for (var n = (filmsList.length - 1); n; n--) {
          if (filmsList[m].movieDatas.year > filmsList[m + 1].movieDatas.year) {
            var temp = filmsList[m]
            filmsList[m] = filmsList[m + 1]
            filmsList[m + 1] = temp
            temp = ''
            m = 0
          }
          if (filmsList[n].movieDatas.year < filmsList[n - 1].movieDatas.year) {
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

    function sortListByRank(filmsList, callback){
      for (var l = 0; l < filmsList.length; l++) {
        if (filmsList[l].movieDatas.rating == 'N/A') {
          filmsList[l].movieDatas.rating = '0'
        }
      }
      for (var m = 0; m < (filmsList.length - 1); m++) {
        for (var n = (filmsList.length - 1); n; n--) {
          if (filmsList[m].movieDatas.rating > filmsList[m + 1].movieDatas.rating) {
            var temp = filmsList[m]
            filmsList[m] = filmsList[m + 1]
            filmsList[m + 1] = temp
            temp = ''
            m = 0
          }
          if (filmsList[n].movieDatas.rating < filmsList[n - 1].movieDatas.rating) {
            var temp2 = filmsList[n]
            filmsList[n] = filmsList[n - 1]
            filmsList[n - 1] = temp2
            temp2 = ''
            n = (filmsList.length - 1)
          }
        }
      }
      if (m == (filmsList.length - 1) && (!n)) {
        for (var m = 0; m < filmsList.length; m++) {
          if (filmsList[m].movieDatas.rating == '0') {
            filmsList[m].movieDatas.rating = 'N/A'
          }
        }
        return (callback(filmsList))
      }
    }

    function sortListByLength(filmsList, callback){
      for (var l = 0; l < filmsList.length; l++) {
        if (filmsList[l].movieDatas.runtime == 'N/A') {
          filmsList[l].movieDatas.runtime = '0'
        }
      }
      for (var m = 0; m < (filmsList.length - 1); m++) {
        if (filmsList[m].movieDatas.runtime == 'N/A') {
          filmsList[m].movieDatas.runtime = '0'
        }
        for (var n = (filmsList.length - 1); n; n--) {
          if (parseInt(filmsList[m].movieDatas.runtime) > parseInt(filmsList[m + 1].movieDatas.runtime)) {
            var temp = filmsList[m]
            filmsList[m] = filmsList[m + 1]
            filmsList[m + 1] = temp
            temp = ''
            m = 0
          }
          if (parseInt(filmsList[n].movieDatas.runtime) < parseInt(filmsList[n - 1].movieDatas.runtime)) {
            var temp2 = filmsList[n]
            filmsList[n] = filmsList[n - 1]
            filmsList[n - 1] = temp2
            temp2 = ''
            n = (filmsList.length - 1)
          }
        }
      }
      if (m == (filmsList.length - 1) && (!n)) {
        for (var m = 0; m < filmsList.length; m++) {
          if (filmsList[m].movieDatas.runtime == '0') {
            filmsList[m].movieDatas.runtime = 'N/A'
          }
        }
        return (callback(filmsList))
      }
    }

    function filterByTitle(filmsList, newList, filter) {
      return new Promise((resolve, reject) => {
        if (!filter) {
          reject("Erreur: pas de filtre titre!")
        }
        if (filter[filter.length - 1] != ":") {
          var length = filmsList.length
          for (var j = 0; j < length; j++) {
            if ((filter == 'AUTRE') && (filmsList[j].title[0].search(alpha) == -1)) {
              newList.push(filmsList[j])
            }
            else if ((filter != 'AUTRE') && ((filmsList[j].title[0] == filter) || (filmsList[j].title[0] == filter.toLowerCase()))) {
              newList.push(filmsList[j])
            }
          }
          if (j == length) {
            resolve(newList)
          }
        }
        else {
          resolve(filmsList)
        }
      })
    }

    function filterByYear(filmsList, newList, filter) {
      return new Promise((resolve, reject) => {
        if (!filter) {
          reject("Erreur: pas de filtre année!")
        }
        if (filter[filter.length - 1] != ":") {
          var length = filmsList.length
          for (var j = 0; j < length; j++) {
            if ((filter == '<1930') && (parseInt(filmsList[j].movieDatas.year) < 1930)) {
              newList.push(filmsList[j])
            }
            else if ((filter != '<1930') && (parseInt(filmsList[j].movieDatas.year) >= parseInt(filter)) && (parseInt(filmsList[j].movieDatas.year) < (parseInt(filter) + 10))) {
              newList.push(filmsList[j])
            }
          }
          if (j == length) {
            resolve(newList)
          }
        }
        else {
          resolve(filmsList)
        }
      })
    }

    function filterByRank(filmsList, newList, filter) {
      return new Promise((resolve, reject) => {
        if (!filter) {
          reject("Erreur: pas de filtre note!")
        }
        if (filter[filter.length - 1] != ":") {
          var length = filmsList.length
          for (var j = 0; j < length; j++) {
            // console.log(parseInt(filter)+" "+parseInt(filmsList[j].movieDatas.rating))
            if ((parseInt(filmsList[j].movieDatas.rating) >= parseInt(filter)) && (parseInt(filmsList[j].movieDatas.rating) < (parseInt(filter) + 1))) {
              newList.push(filmsList[j])
            }
          }
          if (j == length) {
            resolve(newList)
          }
        }
        else {
          resolve(filmsList)
        }
      })
    }

    function isDatGenre(film, newList, genre) {
      return new Promise((resolve, reject) => {
        if (film == '') {
          reject('Erreur isDatGenre: pas de film')
        }
        var genresTab = film.movieDatas.genres.split(',')
        var length = genresTab.length
        for (var i = 0; i < length; i++) {
          if (genresTab[i].trim() == genre) {
            // console.log(genresTab[i].trim()+" "+genre)
            resolve(film)
          }
        }
      })
    }

    function filterByGenre(filmsList, newList, filter) {
      return new Promise((resolve, reject) => {
        if (!filter) {
          reject("Erreur: pas de filtre genre!")
        }
        if (filter[filter.length - 1] != ":") {
          var length = filmsList.length
          for (var j = 0; j < length; j++) {
            isDatGenre(filmsList[j], newList, filter).then((film) => {
              if (film) {
                // console.log(film)
                newList.push(film)
                j++
              }
            })
            .catch((err) => {
              console.log(err)
            })
            // console.log(length+" "+j)
            if (j == (length - 1)) {
              resolve(newList)
            }
          }
        }
        else {
          resolve(filmsList)
        }
      })
    }

    function filterList(filmsList, filters, callback) {
        var alpha = '/[^A-Za-z]/'
        var newList = []

        filterByTitle(filmsList, newList, filters["title"]).then((titleList) => {
          var newList = []
          filterByYear(titleList, newList, filters["year"]).then((yearList) => {
            var newList = []
            filterByRank(yearList, newList, filters["rank"]).then((rankList) => {
              var newList = []
              filterByGenre(rankList, newList, filters["genre"]).then((genreList) => {
                // socket.listToSort = socket.filmsList
                socket.filmsList2 = genreList
                callback(genreList)
              })
              .catch((err) => {
                console.log(err)
              })
            })
            .catch((err) => {
              console.log(err)
            })
          })
          .catch((err) => {
            console.log(err)
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }

  //L'event de pagination infini en scrollant
  socket.on('getMoreFilms', (data) => {

    var k = 0
    var j = socket.filmsIndex
    if (socket.filmsList2) {
      while ((j < socket.filmsList2.length) && (k < 4)) {
        if (socket.filmsList2[j] && socket.filmsList2[j].movieDatas && (socket.filmsList2[j].movieDatas.poster.slice(0, 4) == "http") && (socket.filmsList2[j].movieDatas.title != socket.filmsList2[j - 1].movieDatas.title)) {
          io.to(data.id).emit('browseFilmsList', {filmsList: socket.filmsList2[j]})
          k++
        }
        j++
      }
    }
    else {
      while ((j < socket.filmsListLength) && (k < 4)) {
        if (socket.filmsList[j] && socket.filmsList[j].movieDatas && (socket.filmsList[j].movieDatas.poster.slice(0, 4) == "http") && (socket.filmsList[j].movieDatas.title != socket.filmsList[j - 1].movieDatas.title)) {
          io.to(data.id).emit('browseFilmsList', {filmsList: socket.filmsList[j]})
          k++
        }
        j++
      }
    }
    socket.filmsIndex = j
  })

  //L'event de gestion du triage/filtrage
  socket.on('getDatSort', (data) => {

    if (socket.filmsList2) {
      var listToSort = socket.filmsList2
    }
    else {
      var listToSort = socket.filmsList
    }
    if (listToSort == '') {
        io.to(data.id).emit('browseFilmsList', {filmsList: 'empty'})
    }

    //Fonction affichant les 8 premiers films
    function firstRow(sortedList) {
      if (sortedList == '') {
        io.to(data.id).emit('browseFilmsList', {filmsList: 'empty'})
      }
      else {
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
    }

    if (data.sort == "title-asc") {
      sortList(listToSort, (filmsList) => {
        firstRow(filmsList)
      })
    }
    else if (data.sort == "title-desc") {
      sortList(listToSort, (filmsList) => {
        filmsList.reverse()
        firstRow(filmsList)
      })
    }
    else if (data.sort == "year-asc") {
      sortListByYear(listToSort, (filmsList) => {
        firstRow(filmsList)
      })
    }
    else if (data.sort == "year-desc") {
      sortListByYear(listToSort, (filmsList) => {
        filmsList.reverse()
        firstRow(filmsList)
      })
    }
    else if (data.sort == "rank-asc") {
      sortListByRank(listToSort, (filmsList) => {
        firstRow(filmsList)
      })
    }
    else if (data.sort == "rank-desc") {
      sortListByRank(listToSort, (filmsList) => {
        filmsList.reverse()
        firstRow(filmsList)
      })
    }
    else if (data.sort == "length-asc") {
      sortListByLength(listToSort, (filmsList) => {
        firstRow(filmsList)
      })
    }
    else if (data.sort == "length-desc") {
      sortListByLength(listToSort, (filmsList) => {
        filmsList.reverse()
        firstRow(filmsList)
      })
    }
    else if (data.title) {
      filterList(listToSort, data, (filmsList) => {
        firstRow(filmsList)
      })
    }
  })


  //L'event de départ lançant la création de la liste de films (avec un titre demandé ou non)
  socket.on('getFilmsList', function(data) {

    // Initialisation des variables
    if (data.title) {
      var title = htmlspecialchars(data.title)
    }
    socket.filmsIndex = 8
    socket.filmsList = []
    socket.filmsListLength = 0
    socket.genres = []
    var list = []


    // Les fonctions
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
        // if (title == '') {
        //   reject('Erreur inList: pas de titre!')
        // }
        if ((list.indexOf(title)) == -1) {
          resolve('ok')
        }
        else {
          reject("film en doublon: "+title)
        }
      })
    }

    function getGenres(genresStr) {
      return new Promise((resolve, reject) => {
        if (genresStr == '') {
          reject('Erreur getGenres: pas de genre')
        }
        var genresTab = genresStr.split(',')
        var length = genresTab.length
        for (var i = 0; i < length; i++) {
          if (socket.genres.indexOf(genresTab[i].trim()) == -1) {
            socket.genres.push(genresTab[i].trim())
            // console.log(socket.genres)
          }
          if (i == (length - 1)) {
            resolve('ok')
          }
        }
      })
    }

    
    function getMovieDatas (filmsList, i, list) {
      inList(list, filmsList[i].title).then((ret) => {
        if (ret == 'ok') {
          // console.log(socket.filmsList.length+" "+filmsList[i].title)
          // console.log(filmsList[i].magnetLink)
          list.push(filmsList[i].title)
          getIMDbDatas(filmsList[i].title, filmsList[i]).then((film) => {
            if (film.movieDatas && (film.movieDatas.poster.slice(0, 4) == "http")) {
              getGenres(film.movieDatas.genres).then((r) => {
                if (r == 'ok') {
                  // console.log(i+" "+filmsList.length)
                  if (i == filmsList.length) {
                    io.to(data.id).emit('browseGenres', {genres: socket.genres})
                  }
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
              })
              .catch(err => {
                console.log(err)
              })
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

    // Les promesses qui gèrent la recherche des deux sources
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
