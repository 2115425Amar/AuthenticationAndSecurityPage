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

mongoose.connect('mongodb://0.0.0.0:27017/userDB', {useNewUrlParser: true,
useUnifiedTopology:true});
//mongoose.set("useCreateIndex",true);

var userSchema = new mongoose.Schema({
    email: String,
    password:String
  });

userSchema.plugin(passportLocalMongoose);

//const secret="Thisisourlittlesecret.";
//userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]});
  
var User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
    res.render("home");
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
        if(req.isAuthenticated()){
            res.render("secrets");
        }else {
            res.redirect("/login");
        }
    });

      app.get('/logout', function(req, res, next) {
        req.logout(function(err) {
          if (err) { return next(err); }
          res.redirect('/');
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

    // app.post("/login",function(req,res){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         password.authenticate("local")(req,res,function(){
    //             res.redirect("/secrets");
    //         });
    //     }
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


    app.get("/submit", function(req, res) {
        res.render("submit");
        });

app.listen(5000, (req, res)=>{
     console.log("The Server has started successfully on PORT 5000")
});

