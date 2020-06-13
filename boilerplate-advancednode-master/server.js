"use strict";
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const pug = require('pug');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//uso de pug template
app.set('view engine', 'pug');

//passport session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

//Database conect

mongo.connect(process.env.DATABASE, (err, db) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
    
//serializacion  deserialización 
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    });
  }
  
  passport.use(new LocalStrategy(
  function(username, password, done) {
    db.collection('users').findOne({ username: username }, function (err, user) {
      console.log('User '+ username +' attempted to log in.');
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
    });
  }
));
  
//autenticar login 
  function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};
//middleware autenticado e implementado en profile
 app
 .route('/profile')
 .get(ensureAuthenticated, (req,res) => {
    res.render(process.cwd() + '/views/pug/profile');
 });  
   //llamar pug template y renderizar
  //formulario de login
  app.route("/").get((req, res) => {
        res.render(process.cwd() + "/views/pug/index", {
          title: 'Home Page ',
          message: "Please login",
          showLogin: true,
        });
      });

  //local passport autenticar
      app
        .route("/login")
        .post(
          passport.authenticate("local", { failureRedirect: "/" }),
          (req, res) => {
            res.redirect("/profile");
          }
        );
 
  //render profile
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + "/views/pug/profile", {
          username: req.user.username,
        });
      });

//llamar logout route to home page
app.route("/logout").get((req, res) => {
        req.logout();
        res.redirect("/");
      });
  
//404 
 app.use((req, res, next) => {
        res.status(404).type("text").send("Not Found");
      }); 

  
  //listen port

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
   
});
