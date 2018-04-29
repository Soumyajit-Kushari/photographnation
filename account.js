const fs = require('fs')
    , security = require('./security');

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
    });;
}
exports.GetUserEmail = function (req, callback) {
    exports.isAutheticated(req, function (result) {
        if (result) {
            fs.readFile("./Data/accounts.json", function (err, data) {
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

exports.Login = function (res, email, pass, callback) {
    fs.readFile("./Data/accounts.json", function (err, data) {
        if (err) return callback(err);

        var db = JSON.parse(data);

        db.forEach(user => {
            security.comparePassword(pass, user.pass, function name(err, isPasswordMatch) {
                if (isPasswordMatch) res.cookie("guid", user.guid);
                return callback(null, isPasswordMatch && (user.email == email));
            });
        });
    });
}