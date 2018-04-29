const express = require('express')
    , account = require('./account')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , md5 = require('md5')
    , fs = require('fs');

const app = express();

var LoginAttempts = 0;
var MaxLoginAttempts = 5;
var LoginRenewTime = 60 * 1000; // milli seconds

// setting up the app

app.listen(process.env.PORT || 1337);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('Static'));
app.set('view engine', 'pug');

// Request for Login

app.post('/Login', function (req, res) {
    var email = req.body.email;
    var pass = req.body.pass;

    account.Login(res, email, pass, function (err, result) {
        res.redirect("/");
        LoginAttempts++;
    });

});

app.get('/img', function (req, res) {

    fs.readFile("./Data/uploads.json", function (err, data) {
        var db = JSON.parse(data);

        db.forEach(img => {
            account.GetUserId(req, function (UserID) {
                if (img.uploader == UserID)
                    res.write("<img class='box img-box' src='./Uploads/" + img.guid + '.' + img.type + "'/>\n");
            });
        });
        res.end();
    });

});

app.get('/', function (req, res) {
    account.isAutheticated(req, function (result) {
        if (result) {
            account.GetUserEmail(req, function (err, email) {
                res.render('home', {
                    email: email,
                    email_md5: md5(email)
                });
            })
        }
        else
            if (LoginAttempts < 1)
                res.render('login');
            else if (LoginAttempts <= MaxLoginAttempts) {
                res.render('login',
                    {
                        err: "Login Failed " +
                            LoginAttempts + "/" +
                            MaxLoginAttempts +
                            " login attempts left"
                    });
            } else {

                setTimeout(function () {
                    LoginAttempts = 0;
                    LoginRenewTime *= 15;

                }, LoginRenewTime);

                res.render('err', {
                    err: "Login Attempts expired",
                    sol: "try reloading after " + LoginRenewTime / (60 * 1000) + "m"
                });
            }
    });
});



