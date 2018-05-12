const fs = require('fs')
    , security = require('./security');

/*
exports.isAutheticated = function (req, callback) {
    return req.cookies.guid == null ?
        callback(false) :
        callback(true);
}
exports.GetUserId = function (req, callback) {
    exports.isAutheticated(req, function (result) {
        if (result) {
            return callback(req.cookies.guid);
        }
        else {
            return callback("USER NOT LOGGED IN");
        }
    });
}
exports.GetUserEmail = function (req, callback) {
    exports.isAutheticated(req, function (result) {
        if (result) {
            fs.readFile("./data/accounts.json", function (err, data) {
                if (err) return callback(err);

                var db = JSON.parse(data);

                db.forEach(user => {
                    if (user.guid == req.cookies.guid)
                        return callback(null, user.email)
                });
            });
        }
        else {
            return callback(null, "USER NOT LOGGED IN");
        }
    });
}
*/

exports.Login = function (res, email, pass, callback) {
    fs.readFile("./data/accounts.json", function (err, data, guid) {
        if (err) console.log(err);

        var db = JSON.parse(data);
        var i = 0;

        db.forEach(user => {
            security.comparePassword(pass, user.pass, function name(err, isPasswordMatch) {
                i++;
                if (isPasswordMatch && (user.email == email)) {
                    return callback(null, isPasswordMatch && (user.email == email), user.guid);
                }
            });
        });

        console.log(i);
        
        if (db.length == i) {
            console.log("err login you in");    
            return callback("err login you in");
        }
    });
}