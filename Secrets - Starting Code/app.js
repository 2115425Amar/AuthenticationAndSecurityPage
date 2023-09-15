//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");

const encrypt = require('mongoose-encryption');

const ejs = require('ejs');
const app = express();

app.set('view engine','ejs')

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set('views', __dirname + '/views');

mongoose.connect('mongodb://0.0.0.0:27017/userDB', {useNewUrlParser: true,
useUnifiedTopology:true});

var userSchema = new mongoose.Schema({
    email: String,
    password:String
  });

//const secret="Thisisourlittlesecret.";
userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]});
  
var User = new mongoose.model("User",userSchema);

app.get("/", function(req, res) {
    res.render("home");
    });

app.get("/login", function(req, res) {
    res.render("login");
    });

app.get("/register", function(req, res) {
    res.render("register");
    });

    app.post("/register",function(req,res){
        const newUser=new User({
          email:  req.body.username,
          password: req.body.password
        });
     
    newUser.save(function(err){
        if(err){
            console.log(err);
            }else{
            res.render("secrets");
        }
    });
    });

    app.post("/login",function(req,res){
        const username= req.body.username;
        const password= req.body.password;

        User.findOne({email:username},function(err,foundUser){
            if(err){
                console.log(err);
            }
            else{
                if(foundUser){
                    if(foundUser.password===password){
                        res.render("secrets");
                    }
                }
            }
        })
    }); 

    app.get("/submit", function(req, res) {
        res.render("submit");
        });

app.listen(5000, (req, res)=>{
     console.log("The Server has started successfully on PORT 5000")
});

