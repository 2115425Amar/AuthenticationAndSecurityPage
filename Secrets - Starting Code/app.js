//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");

//const encrypt = require('mongoose-encryption');
const md5=require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session =require('express-session');
const passport =require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const ejs = require('ejs');
const app = express();

app.set('view engine','ejs')

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set('views', __dirname + '/views');

app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false,
   //cookie: { secure: true }
  }));

app.use(passport.initialize());
app.use(passport.session());






mongoose.connect('mongodb+srv://amar2115425:0A2qyAWPDFwnVR1o@cluster0.qdrwksg.mongodb.net/?retryWrites=true&w=majority',{
    useNewUrlParser: true,
useUnifiedTopology:true});
//mongoose.set("useCreateIndex",true);

var userSchema = new mongoose.Schema({
    email: String,
    password:String,
    googleId:String,
    secret:String
  });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//const secret="Thisisourlittlesecret.";
//userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]});
  
var User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});



passport.use(new GoogleStrategy({
    clientID: "355922333978-3o4apc7m11npf0lqguue7m7lm8p0kqss.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"https://www.googleleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




app.get("/", function(req, res) {
    res.render("home");
    });

app.get("/auth/google",  
    passport.authenticate("google",{scope: ["profile"]}));   


app.get("/auth/google/secrets",
    passport.authenticate( 'google', {
        failureRedirect: "/login"
}),
function(req,res){
    res.redirect('/secrets');
});



app.get("/login", function(req, res) {
    res.render("login");
    });

app.get("/register", function(req, res) {
    res.render("register");
    });

    // app.post("/register",function(req,res){
    //     bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //         const newUser=new User({
    //             email:req.body.username,
    //             password:hash
    //         });

    //         newUser.save(function(err){
    //             if(err){
    //                 console.log(err);
    //                 }else{
    //                 res.render("secrets");
    //             }
    //         });
    //     });
    // });

    app.get("/secrets",function(req,res){
        User.find({"secret":{$ne:null}},function(err,foundUsers){
            if(err){
                console.log(err);
            }else{
                if(foundUsers){
                    res.render("secrets",{usersWithSecrets: foundUsers});
                }
            }
        });
    });


    app.get("/submit",function(req,res){
        if(req.isAuthenticated()){
            res.render("submit");
        }else {
            res.redirect("/login");
        }
    });

    app.post("/submit",function(req,res){
        const submittedSecret = req.body.secret;
        console.log(req.user.id);

        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    foundUser.secret = submittedSecret;
                    foundUser.save(function(){
                        res.redirect("/secrets");
                    })
                }
            }
        });
    });

   
    app.get("/logout", function(req, res) {
        req.logout(function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred during logout' });
            }
            res.redirect("/");
        });
    });
    

    app.post("/register",function(req,res){
        User.register({username:req.body.username},req.body.password ,function(err,user){
            if(err){
                console.log(err);
                res.redirect("/register");
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                })
            }
        })
            
    });

    // app.post("/login",function(req,res){
    //     const username= req.body.username;
    //     const password= req.body.password;

    //     User.findOne({email:username},function(err,foundUser){
    //         if(err){
    //             console.log(err);
    //         }
    //         else{
    //             if(foundUser){
    //                 bcrypt.compare(password,foundUser.password,function(err,result){
    //                     if(result===true){
    //                         res.render("secrets");
    //                     }
    //                 });
    //                     res.render("secrets");
    //                 }
    //             }
    //     });
    // }); 


    app.post("/login", function(req, res) {
        passport.authenticate("local", function(err, user, info) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Authentication failed' });
            }
            req.login(user, function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'An error occurred' });
                }
                return res.redirect("/secrets");
            });
        })(req, res);
    });

    // app.get("/submit", function(req, res) {
    //     res.render("submit");
    //     });

app.listen(3000, (req, res)=>{
     console.log("The Server has started successfully on PORT 3000")
});

