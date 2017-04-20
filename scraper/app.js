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
var util = require('util');
var db_module = require('./db');

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

// read/write access except delete for gmail, and read/write access to calendar
var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-foodmap.json';

// Constants
const DELETE = 0;
const INSERT = 1;

// For testing in Mocha
module.exports.formatEmail = formatEmail;
module.exports.getTimestampFromMime = getTimestampFromMime;
module.exports.getTitleFromMime = getTitleFromMime;
module.exports.getBodyFromMime = getBodyFromMime;
module.exports.getImageFromMime = getImageFromMime;
module.exports.getFood = getFood;
module.exports.getLocation = getLocation;
module.exports.getRequestType = getRequestType;
module.exports.DELETE = DELETE;
module.exports.INSERT = INSERT;

// Data files
var foods = fs.readFileSync(__dirname + '/data/foods.txt').toString().split('\n');
var locations = fs.readFileSync(__dirname + '/data/locationMap.txt').toString().split('\n');
var regexes = fs.readFileSync(__dirname + '/data/regexMap.txt').toString().split('\n');

// Extract location map and alias
var locationMap = {};
var aliasList = [];
for (location of locations) {
    var tokens = location.split(',');
    locationMap[tokens[0]] = tokens[1];
    aliasList.push(tokens[0]);
}

var regexMap = {};
var regexList = [];
for (regex of regexes) {
    var tokens = regex.split(',');
    regexMap[tokens[0]] = tokens[1];
    regexList.push(tokens[0]);
}

if(process.env.client_secret) { // FIXME: Better way to detect Heroku?
    fs.writeFile(__dirname + '/client_secret.json', process.env.client_secret);
}

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

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
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
var main = function (auth) {

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
                    // setTimeout(parseEmail, 1000+(1000*index), res.messages[index].id, markAsRead)
                    setTimeout(parseEmail, 1000+(1000*index), res.messages[index].id, function(){})
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

        // if(result.payload.headers.find(x => x.name === "To") !== "freefood@princeton.edu")
        if (typeof result.payload.headers.find(x => x.name === "Sender") === "undefined"
        || result.payload.headers.find(x => x.name === "Sender").value !== "Free Food <freefood@princeton.edu>") {
            return;
        }

        // Log used for debugging
        // fs.appendFile('debug.json', JSON.stringify(result, null, 4), function(err) {
        //     if(err) { console.log(err); }
        // })

        entry = formatEmail(result, messageId);

        // INSERT or DELETE entry
        if(getRequestType(entry.title+entry.body) == INSERT) {
            db.insert(entry);
        }
        else {
            db.delete(entry);
        }
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

/**
 * Formats a MIME message from the API to fit the database specification.
 *
 * @param {Object} mimeMessage The MIME message to reformat.
 */
function formatEmail(mimeMessage, messageId) {
    var timestamp = getTimestampFromMime(mimeMessage);
    var title = getTitleFromMime(mimeMessage);
    var body = getBodyFromMime(mimeMessage);
    var image = getImageFromMime(mimeMessage);
    var food = getFood(title+body);
    var location = getLocation(title+body);
    var threadId = mimeMessage.threadId;
    var requestType = getRequestType(body);

    return {timestamp: timestamp, location: location, title: title, body: body, food: food, image: image, threadId: threadId, requestType: requestType};
}

/**
 * Get timestamp from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getTimestampFromMime(mimeMessage) {
    // FIXME: Exception for parseInt?
    return new Date(parseInt(mimeMessage.internalDate)).toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Get title (subject) from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getTitleFromMime(mimeMessage) {
    return mimeMessage.payload.headers.find(x => x.name === "Subject").value;
}

/**
 * Get body from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getBodyFromMime(mimeMessage) {
    // Following this documentation:
    // https://msdn.microsoft.com/en-us/library/gg672007(v=exchg.80).aspx
    // except for multipart/mixed
    var body;

    // Content-Type: text/plain
    if(mimeMessage.payload.mimeType === 'text/plain') {
        rawBody = mimeMessage.payload.body.data;
        body = Buffer.from(rawBody, 'base64').toString("ascii");
    }

    // Content-Type: multipart/alternative
    else if(mimeMessage.payload.mimeType === 'multipart/alternative') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType === "text/plain") === 'undefined') {
            body = "";
        }
        else {
            rawBody = mimeMessage.payload.parts.find(x => x.mimeType === "text/plain").body.data;
            body = Buffer.from(rawBody, 'base64').toString("ascii");
        }
    }

    // Content-Type: multipart/related
    else if(mimeMessage.payload.mimeType === 'multipart/related') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative") === 'undefined') {
            body = "";
        }
        else {
            if(typeof mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative").parts.find(x => x.mimeType === "text/plain") === 'undefined') {
                body = "";
            }
            else {
                rawBody = mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative").parts.find(x => x.mimeType === "text/plain").body.data;
                body = Buffer.from(rawBody, 'base64').toString("ascii");
            }
        }
    }

    // Content-Type: multipart/mixed
    else if(mimeMessage.payload.mimeType === 'multipart/mixed') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative") === 'undefined') {
            body = "";
        }
        else {
            if(typeof mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative").parts.find(x => x.mimeType === "text/plain") === 'undefined') {
                body = "";
            }
            else {
                rawBody = mimeMessage.payload.parts.find(x => x.mimeType === "multipart/alternative").parts.find(x => x.mimeType === "text/plain").body.data;
                body = Buffer.from(rawBody, 'base64').toString("ascii");
            }
        }
    }

    else {
        console.log("getBodyFromMime() unexpected case");
        body = "";
    }

    /* Delete FreeFood footer */
    body = body.replace('-----\r\nYou are receiving this email because you are subscribed to the Free Food mailing list, operated by the USG. If you have questions or are having difficulties with this listserv, please send an email to usg@princeton.edu.\r\n\r\nIn your message to the freefood listserv, please state what type of food it is, where it is, until when it will be available and how delicious it is.\r\n\r\nTo unsubscribe, please email listserv@princeton.edu the line UNSUBSRIBE FREEFOOD in the body of the message. Please be sure to remove your e-mail signature (if any) before you send that message.\r\n', '');

    /* Delete null character 0x00 */
    body = body.replace(/\0/g, '');

    return body;
}

/**
 * Get image from a given MIME Message if there is an image, returns undefined if not.
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getImageFromMime(mimeMessage) {
    var imageName;
    var imageData;

    // FIXME: Other content types?
    // Content-Type: multipart/mixed
    if(mimeMessage.payload.mimeType === 'multipart/mixed') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/") === 'undefined') {
            return undefined;
        }
        else {
            imageName = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").filename;
            var attachmentId = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").body.attachmentId;

            // FIXME: Check size?
            // Get Attachment
            google.gmail('v1').users.messages.attachments.get({
                userId: 'me',
                id: attachmentId,
                messageId: mimeMessage.id
            }, function(err, result) {
                var encodedImage = result.data;
                imageData = Buffer.from(encodedImage, 'base64');

                // Create file
                // FIXME: Should use different file name in case of conflict!
                // FIXME: Temporarily disable for speed
                //fs.writeFile(__dirname + '/' + imageName, imageData, function(err) {});
            });

            return {name: imageName, data: imageData};
        }
    }
    else {
        return undefined;
    }
}

/**
 * Get all foods that are in the text
 *
 * @param {Object} text The text to search for food
 */
function getFood(text) {
    var matches = [];

    // FIXME: Better list of punctuations
    text = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
    for(food of foods) {
        if(text.indexOf(food.toLowerCase()) > - 1) { // Substring search
            food = food.charAt(0).toUpperCase() + food.slice(1);
            matches.push(food);
        }
    }

    return matches;
}

/**
 * Get all locations that are in the text
 *
 * @param {Object} text The text to search for locations
 */
function getLocation(text) {
    // FIXME: There should only be one location per email
    var location = "";
    var aliasLength = 0;

    // FIXME: Better list of punctuations
    text = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
    for(loc of aliasList) {
        if(text.indexOf(loc.toLowerCase()) > - 1) { // Substring search
            if(aliasLength < loc.length) { // For longest match
                location = locationMap[loc];
                aliasLength = loc.length;
            }
        }
    }
    for(regex of regexList) {
        var regexp = new RegExp(regex, 'i');
        var result = text.match(regexp);
        if(result) {
            if(aliasLength < regex.length) { // For longest match
                location = regexMap[regex];
                aliasLength = loc.length;
            }
        }
    }

    return location;
}

/**
 * Check type of request
 *
 * @param {Object} text The text to be inspected
 */
function getRequestType(text) {
    // FIXME: Better list of punctuations
    text = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
    var deleteRequests = ["all gone"];
    for(req of deleteRequests) {
        if(text.indexOf(req) > -1) {
            return DELETE;
        }
    }
    return INSERT;
}
