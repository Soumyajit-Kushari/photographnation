const express = require('express')
    , account = require('./scripts/account')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , md5 = require('md5')
    , fs = require('fs')
    , formidable = require('formidable')
    , client = require('ftp')
    , security = require('./scripts/security')
    , url = require('url');


const app = express();

var LoginAttempts = 0;

/*
    , MaxLoginAttempts = 5
    , LoginRenewTime = 60 * 1000
    , LoginTime = 60 * 60 * 24 * 7 * 1000;
*/

// setting up the app

app.listen(process.env.PORT || 1337);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('static'));
app.set('view engine', 'pug');

// Request for Login

app.post('/Login', function (req, res) {
    var email = req.body.email;
    var pass = req.body.pass;
    var guid = 'NaN';
    
    account.Login(res, email, pass, function (err, result, id) {
        if (result) {
            guid = id;
        }

        res.redirect("/?login:" + guid);
    });
});

app.get('/img', function (req, res) {
    fs.readFile("./data/uploads.json", function (err, data) {
        if(err) throw err;
        
        var db = JSON.parse(data);
        var q = url.parse(req.url, true).query;
        var guid = q.guid;
        var data = [];

        for (let i = db.length - 1; i >= 0; i--) {
            var img = db[i];

            if (img.uploader == guid)
                data.push(img);
        }

        res.json(data);
        res.end();
    });
});

app.post('/upload-ftp', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        var imgName = "undefined";
        security.GenerateUniqueID((result) => imgName = result);

        var opath = files.filetoupload.path;
        var npath = './temp_upload/' + imgName + "." + files.filetoupload.type.split("/")[1];

        fs.rename(opath, npath, function (err) {
            if (err) throw err;

            var uploader_id = 0;
            uploader_id = fields.guid;

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

                    fs.readFile("./data/uploads.json", function (err, data) {
                        if (err) throw err;

                        var db = JSON.parse(data);

                        db.push({ "guid": imgName, 'uploader': uploader_id, 'type': files.filetoupload.type.split("/")[1], 'date': Date.now(), 'tags': fields.tags.toString() })
                        data = JSON.stringify(db);


                        fs.writeFile("./data/uploads.json", data, function (err, data) {
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


/*app.get('/', function (req, res) {
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
});*/