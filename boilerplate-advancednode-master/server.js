"use strict";

//variables
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const LocalStrategy = require('passport-local');

const app = express();

//For FCC testing purposes
fccTesting(app);
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set pug template
app.set("view engine", "pug");

//passport middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);
//iniciar passport
app.use(passport.initialize());
app.use(passport.session());

//BASE DE DATOS MONGO

mongo.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },(err, db) => {
  if (err) { 
    console.log('Database error: ' + err);
  } else { 
    console.log("Successful database connection");

    //uso de passport para autenticar user DB al hacer login
    passport.use(
      new LocalStrategy((username, password, done) => {
        db.collection("users").findOne({ username: username }, (err, user) => {
          console.log("User " + username + " attempted to log in.");
          if (err) return done(err);
          if (!user) return done(null, false);
          if (password !== user.password) return done(null, false);

          return done(null, user);
        });
      })
    );
   
    
    //serialization and app.listen van dentro de mongodb
    //serializar y deserializar
    passport.serializeUser((user, done) => {
      done(user._id);
    });

    passport.deserializeUser((id, done) => {
      db.collection('users').findOne(
       {_id: new ObjectID(id)},
         (err, doc) => {
            done( doc);
         }
       );
    });
    

    //pug template
    app.route("/").get((req, res) => {
      res.render(process.cwd() + "/views/pug/index", {
        title: "Hello",
        message: "Please login",
        //formulario de inicio de sesión
        showLogin: true,
        //formulario de registro
        showRegistration: true
      });
    });
    
   // funcion middleware para verificacion de login de user
    function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}; 
    
    //ruta de inicio de sesión - profile home
app
        .route("/login")
        .post(
          passport.authenticate("local", { failureRedirect: "/" }),
          (req, res) => {
            res.redirect("/profile");
          }
        );

    //middleware dirige a profile
      app.route("/profile").get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + "/views/pug/profile", {
          username: req.user.username,
        });
      });
    
    //logout 
    app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
});
      
    //registro de usuario
    app.route('/register')
  .post((req, res, next) => {
    db.collection('users').findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) { 
        res.redirect('/');
      } else {
        db.collection('users').insertOne({
          username: req.body.username,
          password: req.body.password
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              next(null, user);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
   
    //página faltante - error 404
    app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

    //listen PORT

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});
