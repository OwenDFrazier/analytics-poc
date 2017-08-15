var pg = require('pg');

var connectionString = process.env.DATABASE_URL || "postgres://analytics-poc-local:analytics-poc-local@localhost/analytics-poc-local";

function _runQuery(query, params, callback) {
  console.log("_runQuery: " + query + ", params on next line");
  console.log(params);
  var client = new pg.Client({connectionString: connectionString});
  client.connect(function(err) {
    if(err) {
      console.error('could not connect to postgres', err);
      return callback(err, null);
    }
    client.query(query, params, function(err, result) {
      if(err) {
        console.error('error running query', query);
        return callback(err, null);
      }
      console.log("_runQuery, result on next line");
      console.log(result);
      client.end();
      callback(null, result);
    });
  });  
}

function init(callback) {
  var initQuery = "DROP TABLE IF EXISTS sessions;"+
                  "CREATE TABLE sessions (token_hash text UNIQUE, user_id text UNIQUE);"+
                  "DROP TABLE IF EXISTS users;"+
                  "CREATE TABLE users (user_id text UNIQUE);";
  _runQuery(initQuery, [], callback);
}

function addUser(userId, callback) {
  _runQuery("INSERT INTO users VALUES ($1);", [userId], callback);
}

function getUser(userId, callback) {
  _runQuery("SELECT user_id FROM users WHERE user_id=$1", [userId], callback);
}

function deleteUser(userId, callback) {
  _runQuery("DELETE FROM users WHERE user_id=$1", [userId], callback);
}

function addSession(userId, tokenHash, callback) {
  _runQuery("INSERT INTO sessions VALUES ($1, $2);", [tokenHash, userId], callback);
}

function getSession(tokenHash, callback) {
  _runQuery("SELECT user_id FROM sessions WHERE token_hash=$1", [tokenHash], callback);
}

function deleteSession(tokenHash, callback) {
  _runQuery("DELETE FROM sessions WHERE token_hash=$1", [tokenHash], callback);
}

exports.init = init;
exports.addUser = addUser;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.addSession = addSession;
exports.getSession = getSession;
exports.deleteSession = deleteSession;
