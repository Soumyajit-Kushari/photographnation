var uuid = require('uuid/v4');

exports.GenerateUniqueID = function (callback) {
  return callback(uuid());
}