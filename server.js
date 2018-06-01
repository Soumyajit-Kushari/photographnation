const express = require('express')
    , bodyParser = require('body-parser')
    , fs = require('fs')
    , client = require('ftp')
    , security = require('./scripts/security')
    , url = require('url')
    , fileUpload = require('express-fileupload');

const app = express();

// setting up the app

app.listen(process.env.PORT || 1337);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('static'));
app.use(fileUpload());

// Application routing

app.get('/img', function (req, res) {
    fs.readFile("./data/uploads.json", function (err, data) {
        if (err) throw err;

        var db = JSON.parse(data);
        var q = url.parse(req.url, true).query;

        var data = [];
        var returnData = [];

        if (q.guid != "null")
            db.forEach(img => { if (q.guid == img.uploader) data.push(img); });
        else
            db.forEach(img => { data.push(img); });

        if (q.page != null && q.fetch_count != null) {
            for (let i = data.length - (q.page - 1) * q.fetch_count - 1;
                i >= data.length - (q.page - 1) * q.fetch_count - q.fetch_count;
                i--) {

                var img = data[i];

                if (q.tag != null && q.tag != "null") {
                    var tagArr = img.tags.split(',');
                    var k = 0;
                    for (let i = 0; i < tagArr.length; i++) {
                        const tag = tagArr[i];
                        if (q.tag.split(',').indexOf(tag) != -1)
                            k++;
                    }
                    if (k == q.tag.split(',').length)
                        returnData.push(img);
                }
                else {
                    returnData.push(img);
                }
            }
        }
        else {
            for (let i = data.length - 1; i >= 0; i--) {
                var img = data[i];

                if (q.tag != null && q.tag != "null") {
                    var tagArr = img.tags.split(',');
                    var k = 0;
                    for (let i = 0; i < tagArr.length; i++) {
                        const tag = tagArr[i];
                        if (q.tag.split(',').indexOf(tag) != -1)
                            k++;
                    }
                    if (k == q.tag.split(',').length)
                        returnData.push(img);
                }
                else {
                    returnData.push(img);
                }
            }
        }

        res.json(returnData);
        res.end();
    });
});

app.post('/upload', function (req, res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    let file = req.files.filetoupload;

    var uploader_id = req.body.guid;
    var tags = req.body.tags;
    var imgName = "undefined";
    var imgType = file.mimetype.split('/')[1]; // image/jpeg
    
    security.GenerateUniqueID((result) => imgName = result);

    var npath = './temp/' + imgName + '.' + imgType;

    file.mv(npath, function (err) {
        if (err)
            return res.status(500).send(err);

        //// UPLOADING TO GEOCITES

        var c = new client(); // c === ftp client

        c.on('ready', function () {
    
            c.put(npath, (imgName + "." + imgType), function (err) {

                if (err) return res.status(500).send(err);

                var data = "[]";

                fs.readFile("./data/uploads.json", function (err, data) {
                    if (err) return res.status(500).send(err);

                    var db = JSON.parse(data);

                    var dataSet = {
                        "guid": imgName,
                        "uploader": uploader_id,
                        "type": imgType,
                        "date": Date.now(),
                        "tags": tags.toString().toLowerCase(),
                        "thumbs_up": 0
                    };

                    db.push(dataSet);
                    data = JSON.stringify(db);


                    fs.writeFile("./data/uploads.json", data,function (err) {
                        if (err) return res.status(500).send(err);
                        fs.unlinkSync(npath);
                    });
                });

                c.end();
                res.redirect("/");
            })
        });

        c.connect(
            {
                host: "ftp.geocities.ws",
                user: "photographnation",
                password: "ayear789"
            });
    });
});

app.post("/google-login", function (req, res) {
    var email = req.body.email
        , image_url = req.body.image_url
        , name = req.body.name;

    fs.readFile("./data/accounts.json", function (err, data) {
        if (err) throw err;

        var db = JSON.parse(data);
        var i = 0;
        //var result;

        for (i = 0; i < db.length; i++) {
            const user = db[i];

            if (user.email == email) {
                db[i].image_url = image_url; // updating the old profile picture

                var data = JSON.stringify(db);
                fs.writeFileSync("./data/accounts.json", data);

                return res.end(user.guid);
            }
        }

        security.GenerateUniqueID(function (result) {

            if (i == db.length) {
                var dataSet =
                    {
                        "guid": result,
                        "image_url": image_url,
                        "email": email,
                        "name": name,
                        "tags": "all",
                        "role": "user"
                    };

                db.push(dataSet);

                var data = JSON.stringify(db);
                fs.writeFileSync("./data/accounts.json", data);

                return res.end(result);
            }
        });
    });
});

app.post("/thumbs-up", function (req, res) {
    fs.readFile("./data/thumbs_up.json", function (err, data) {
        var db = JSON.parse(data);

        const guid = req.body.guid
            , user = req.body.user
            , type = req.body.type;

        var i = 0;
        for (i = 0; i < db.length; i++) {
            const thumbs_up = db[i];

            if (thumbs_up.guid == guid && thumbs_up.user == user && thumbs_up.type == type) {
                return res.end();
            }
        }

        if (i == db.length) {
            var dataSet = {
                "guid": guid,
                "user": user,
                "type": type
            };

            var upload_data = fs.readFileSync("./data/uploads.json");
            var uploadsDB = JSON.parse(upload_data);

            for (var i = 0; i < uploadsDB.length; i++) {

                if (uploadsDB[i].guid == guid) {
                    uploadsDB[i].thumbs_up++;
                }
            }

            fs.writeFileSync("./data/uploads.json", JSON.stringify(uploadsDB));

            db.push(dataSet);
            fs.writeFileSync("./data/thumbs_up.json", JSON.stringify(db));
            return res.end();
        }
    });
});

app.post("/check-thumbs", function (req, res) {
    fs.readFile("./data/thumbs_up.json", function (err, data) {
        var db = JSON.parse(data);

        const guid = req.body.guid
            , user = req.body.user
            , type = req.body.type;

        var i = 0;
        for (i = 0; i < db.length; i++) {
            const thumbs_up = db[i];

            if (thumbs_up.guid == guid && thumbs_up.user == user && thumbs_up.type == type) {
                return res.end("true");
            }
        }

        if (i == db.length) {
            return res.end("false")
        }
    });
});

app.get("/get_profile", function (req, res) {
    fs.readFile("./data/accounts.json", function (err, data) {
        if (err) throw err;

        var q = url.parse(req.url, true).query;
        var guid = q.guid;
        var db = JSON.parse(data);
        var i = 0;

        db.forEach(user => {
            i++;
            if (user.guid == guid) {
                res.json(user);
                res.end();
            }
        });

        if (i == db.length) {
            res.end("NaN");
        }

    });
});
