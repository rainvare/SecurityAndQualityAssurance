//challenge 13: Clean Up Your Project with Modules
const passport      = require( 'passport' );
const bcrypt        = require( 'bcrypt' ); //challenge 12: Hashing Your Password

module.exports = function (app, db) {
  //challlenge 8: Create New Middleware
  function ensureAuthenticated (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }
  
    app.get( '/', ( req,res )=> res.render(
      process.cwd() + '/views/pug/index.pug', //Challenge 1: Set up a Template Engine
      {
        title: 'Home page', //challenge 2: Use a Template Engine's Powers
        message: 'Please login',
        showLogin: true, //challenge 7: How to Use Passport Strategies
        showRegistration: true //challenge 11: Registration of New Users
      }
    ));
 
    app.route('/login').post( //challenge 7: How to Use Passport Strategies
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => res.redirect('/profile')
    );

    app.route('/profile')
       .get(ensureAuthenticated, (req, res) => {
      /*if(Math.random() > .33) {
        res.render(process.cwd() + '/views/pug/profile');
      } */
      if(Math.random() > .33) {
        res.render(process.cwd() + '/views/pug/profile');
      } 
      
      else {      
        res.redirect('/');
      }  
    });

    //challenge 10: Logging a User Out
    app.route('/logout').get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  //challenge 11: Registration of New Users
  app.route( '/register' )
    .post( ( req,res,next ) => {
      db.collection( 'users' ).findOne({ username: req.body.username }, (error,user) => {
        if ( error ) next( error );
        else if ( user ) res.redirect( '/' );
        else {
          const hash = bcrypt.hashSync( req.body.password, 12 );
          db.collection( 'users' ).insertOne(
            { username: req.body.username, 
              password: hash }, //challenge 12: Hashing Your Passwords
              ( error,doc ) => {
                if ( error ) res.redirect( '/' );
                else next( null,user );
              }//end error,doc
            );//end insert one
        }//end else
      }//end error,user
      )//end find.one
    },//end post
    passport.authenticate( 'local', { successRedirect: '/profile', failureRedirect: '/' } )
  );//end app.route

    //challenge 10: Logging a User Out
    app.use((req, res, next) => {
      res.status(404).type('text').send('Not Found');
    }); 
}
