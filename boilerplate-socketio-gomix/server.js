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
const passportSocketIo = require('passport.socketio'); //challenge 20: Authentication with Socket.IO
const cookieParser= require('cookie-parser');
const app         = express();
const http        = require('http').Server(app);
const sessionStore= new session.MemoryStore();
const io          = require('socket.io')(http); //challenge 17: Set up the Environment
const cors        = require('cors');
app.use(cors()); 

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  accept(null, true);
  accept();
}
 
function onAuthorizeFail(data, message, error, accept){
  if(error)
    throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

//challenge 20: Authentication with Socket.IO
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          'express.sid',
  secret:       process.env.SESSION_SECRET,
  store:        sessionStore
}));
 
mongo.connect(process.env.DATABASE, (err, client) => {
    if(err) console.log('Database error: ' + err);
    
    app.use(session({
      secret:       process.env.SESSION_SECRET,
      resave:       true, 
      saveUninitialized: true,
      key:               'express.sid',
      store:              sessionStore,
      success:            onAuthorizeSuccess,
      fail:               onAuthorizeFail,
    })); 
  
    let db = client.db('FCC');
    auth(app, db);
    routes(app, db); 
  
    http.listen(process.env.PORT || 3000);
 
    //start socket.io code  
    let currentUsers = 0; //challengs 18: Communicate by Emitting
    io.on('connection', socket => {
      
      console.log("User"+socket.request.user.name +"has connected"); 
      
      //challengs 18: Communicate by Emitting, challenge 21: Announce New Users
      ++currentUsers;
      console.log('current users: ' +currentUsers);
      io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
     
      socket.on('chat message', message => {
        console.log('New message ' +message);
        io.emit('chat message', {name: socket.request.user.name, message});
      })
      
      //challenge 19: Handle a Disconnect
      socket.on('disconnect', () => { 
        console.log('user ' +socket.request.user.name + ' has disconnected' );
        --currentUsers;
        console.log('current users: ' +currentUsers);
        io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
      }); 
    });
    //end socket.io code
}); 

