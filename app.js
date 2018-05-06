const express = require('express')
    , account = require('./account')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , md5 = require('md5')
    , fs = require('fs')
    , formidable = require('formidable')
    , client = require('ftp')
    , security = require('./security');

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
                    res.write("<img class='box img-box' src='http://www.geocities.ws/photographnation/" + img.guid + '.' + img.type + "'/>\n");
            });
        });
        res.end();
    });

});

app.post('/upload-ftp', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        var imgName = "undefined";
        security.GenerateUniqueID((result) => imgName = result);

        var opath = files.filetoupload.path;
        var npath = './tempUpload/' + imgName + "." + files.filetoupload.type.split("/")[1];

        fs.rename(opath, npath, function (err) {
            if (err) throw err;

            var uploader_id = 0;
            account.GetUserId(req, (result) => uploader_id = result);

            //// UPLOADING TO GEOCITES
                var c = new client(); // c === ftp client

                c.on('ready', function () {
                    c.put(npath, (imgName + "." + files.filetoupload.type.split("/")[1]), function (err) {

                        if (err) {
                            console.log(err);
                        }


                        //////////////////////////////////
                        //// adding to database //////////
                        //////////////////////////////////

                        var data = "[]";

                        fs.readFile("./Data/uploads.json", function (err, data) {
                            if (err) throw err;

                            var db = JSON.parse(data);

                            var UserID = "";
                            account.GetUserId(req, (result) => UserID = result);

                            db.push({ "guid": imgName, 'uploader': UserID, 'type': files.filetoupload.type.split("/")[1] })
                            data = JSON.stringify(db);


                            fs.writeFile("./Data/uploads.json", data, function (err, data) {
                                if (err) throw err;
                                fs.unlink(npath, (err) => console.log(err));
                            });
                        });

                        c.end();
                    })
                });

                c.connect(
                    {
                        host: "ftp.geocities.ws",
                        user: "photographnation",
                        password: "ayear789"
                    });
            res.redirect("/");
        });
    });

});


app.get('/home', function (req, res) {

    /// this page requires authentication

    account.isAutheticated(req, function (result) {
        if (!result) res.redirect("/");

        account.GetUserEmail(req, function (err, email) {
            res.render('home', {
                email: email,
                email_md5: md5(email)
            });
        })
    });
})


app.get('/', function (req, res) {
    account.isAutheticated(req, function (result) {
        if (result) {
            res.redirect("/home");
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



