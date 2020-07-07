'use strict';
const dotenv = require('dotenv').config()
const express     = require('express');
const session     = require('express-session');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const auth        = require('./app/auth.js');
const routes      = require('./app/routes.js');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const cookieParser= require('cookie-parser')
const app         = express();
const http        = require('http').Server(app);
const sessionStore= new session.MemoryStore();
const io          = require('socket.io')(http); //challenge 17: Set up the Environment
const cors        = require('cors');
const passportSocketIo =require('passport.socketio') ; //challenge 20 users with passport socket io
app.use(cors()); 

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));


mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) console.log('Database error: ' + err);
 auth(app, db);
routes(app, db);
      
        app.listen(process.env.PORT || 3000, () => {
          console.log("Listening on port " + process.env.PORT);
        });  

  //challenge 20: Authentication with Socket.IO (antes del socket)
  io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          'express.sid',
  secret:       process.env.SESSION_SECRET,
  store:        sessionStore
}));
  
    //start socket.io code  
  var currentUsers = 0; //challenge 18
  
io.on('connection', socket => {//challenge 17
  console.log("User"+socket.request.user.name +"has connected");
  
  ++currentUsers; //challenge 18 conteo de usuarios(tambien en client)
  io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});

  //challenge 22 chat
  socket.on('chat message', message => {
        console.log('New message ' +message);
        io.emit('chat message', {name: socket.request.user.name, message});
      })
  
  
  
  //challenge 19: Disconnect
socket.on('disconnect', () => { 
        --currentUsers;
        console.log('current users: ' +currentUsers);
        console.log('user ' +socket.request.user.name + ' has disconnected' );
        io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
      }); 
});
    //end socket.io code 
  
  
});
