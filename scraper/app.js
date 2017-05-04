/******************************************************************************/
/* app.js                                                                     */
/* Author: Seung Jae Lee                                                      */
/* Parts of code from                                                         */
/* https://developers.google.com/google-apps/calendar/quickstart/node         */
/******************************************************************************/

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var db_module = require('./db');
var scraper = require('./scraper');

// Pick database implementation (sqlite/postgres) based on environment variable
// PROJECT_MODE
var db;
if (process.env.PROJECT_MODE === 'development') {
    db = db_module.db.sqlite;
} else if (process.env.PROJECT_MODE === 'production') {
    db = db_module.db.postgres;
} else {
    console.error('Error: PROJECT_MODE not set. Cannot set up database. Did you activate the virtual environment in the Django project?');
    process.exit(1);
}

// read/write access except delete for gmailAutho
var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-foodmap.json';


if(process.env.PROJECT_MODE === 'production') {
    authorize(JSON.parse(process.env.client_secret), main);
}
else if(process.env.PROJECT_MODE === 'development') {
    // Load client secrets from a local file.
    fs.readFile(__dirname + '/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // main program.
        authorize(JSON.parse(content), main);
    });
}
else {
    console.error('Error: PROJECT_MODE not set. Cannot set up database. Did you activate the virtual environment in the Django project?');
    process.exit(1);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Use JSON given from process environment
    if (process.env.PROJECT_MODE === 'production') {
        oauth2Client.credentials = JSON.parse(process.env.CREDENTIALS);
        callback(oauth2Client);
    }
    // Check if we have previously stored a token.
    else if (process.env.PROJECT_MODE === 'development') {
        fs.readFile(TOKEN_PATH, function(err, token) {
            if (err) {
                getNewToken(oauth2Client, callback);
            } else {
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
            }
        });
    }
    else {
        console.error('Error: PROJECT_MODE not set. Cannot authorize API');
        process.exit(1);
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Parses events from all unread emails and prints them stdout
 *
 * @param {Object} auth Authorization credentials for Google APIs.
 */
function main (auth) {

    // set auth as a global default
    google.options({auth: auth});

    google.gmail('v1').users.messages.list({ // Get unread message list
        userId: 'me',
        q: 'is:unread',
    }, function (err, res) {

        // if unread message exists
        if (!err && res && res.messages && res.messages.length) {
            for(var i = 0; i < res.messages.length; i++) {
                (function(index) {
                    // Timeout to prevent making too many requests at once
                    setTimeout(parseEmail, 1000+(1000*index), res.messages[index].id, markAsRead);
                    // replace with below for debugging:
                    // setTimeout(parseEmail, 1000+(1000*index), res.messages[index].id, function(){})
                })(i);
            }
        } else {
            console.log('No unread message exists');
        }
    });
};

/**
 * Parses email and inserts or deletes an entry to/from the database
 *
 * @param {Object} messageId The id of a message to be parsed
 * @param {Function} callback The markAsRead function to be called after parsing completes
 */
function parseEmail(messageId, callback) {
    google.gmail('v1').users.messages.get({
        userId: 'me',
        id: messageId,
    }, function(err, result) {

        if(err) {
            console.log(err);
            return;
        }

        // Check if the sender is Free Food Listserv
        // if(result.payload.headers.find(x => x.name === "To") !== "freefood@princeton.edu")
        if (typeof result.payload.headers.find(x => x.name === "Sender") === "undefined"
        || result.payload.headers.find(x => x.name === "Sender").value !== "Free Food <freefood@princeton.edu>") {
            return;
        }

        entry = scraper.formatEmail(result, messageId);
        // saveImage(entry.image.id, messageId);

        // INSERT or DELETE entry
        if(scraper.getRequestType(entry.title+entry.body) == scraper.INSERT) {
            db.insert(entry);
        }
        else {
            db.delete(entry);
        }

        callback(messageId);
    });
}

/**
 * Marks a message with given id as read
 *
 * @param {Object} messageId The id of a message to be marked as read
 */
function markAsRead(messageId) {
    // Mark email as read by deleting UNREAD label
    google.gmail('v1').users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: { removeLabelIds: ['UNREAD'] },
    }, function(err, result) {
        if(err) {
            console.log(err);
        }
    });
}

function saveImage(imageId, messageId) {
    // FIXME: Check size?
    // Get Attachment
    google.gmail('v1').users.messages.attachments.get({
        userId: 'me',
        id: imageId,
        messageId: messageId
    }, function(err, result) {
        var encodedImage = result.data;
        imageData = Buffer.from(encodedImage, 'base64');

        // Create file
        // FIXME: Should use different file name in case of conflict!
        //fs.writeFile(__dirname + '/' + imageName, imageData, function(err) {});
    });
}
