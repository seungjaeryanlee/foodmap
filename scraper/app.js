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
var sqlite3 = require('sqlite3').verbose();

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
var foods = fs.readFileSync('./data/foods.txt').toString().split('\n');
var locations = fs.readFileSync('./data/locations.txt').toString().split('\n');
var db = new sqlite3.Database('./data/db.sqlite3');


// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
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
                var messageId = res.messages[i].id;

                // FIXME: Temporarily disabled for testing
                // Mark email as read by deleting UNREAD label
                // google.gmail('v1').users.messages.modify({
                //     userId: 'me',
                //     id: messageId,
                //     resource: { removeLabelIds: ['UNREAD'] },
                // });

                // Get content of email
                google.gmail('v1').users.messages.get({
                    userId: 'me',
                    id: messageId,
                }, function(err, result) {
                    // if(result.payload.headers.find(x => x.name === "To") !== "freefood@princeton.edu")
                    // if (typeof result.payload.headers.find(x => x.name === "Sender") === "undefined"
                    // || result.payload.headers.find(x => x.name === "Sender").value !== "Free Food <freefood@princeton.edu>") {
                    //     return;
                    // }

                    // FIXME: Log for debugging
                    fs.appendFile('debug.json', JSON.stringify(result, null, 4), function(err) {
                        if(err) { console.log(err); }
                    })

                    entry = formatEmail(result, messageId);

                    // INSERT or DELETE entry
                    if(getRequestType(entry.title+entry.body) == INSERT) {
                        insertToDB(entry);
                    }
                    else {
                        deleteFromDB(entry);
                    }
                });
            }
        } else {
            console.log('No unread message exists');
        }
    });
};

/**
 * Formats a MIME message from the API to fit the database specification.
 *
 * @param {Object} mimeMessage The MIME message to reformat.
 */
function formatEmail(mimeMessage, messageId) {
    var timestamp = getTimestampFromMime(mimeMessage);
    var title = getTitleFromMime(mimeMessage);
    var body = getBodyFromMime(mimeMessage);
    var image = getImageFromMime(mimeMessage, messageId);    
    var food = getFood(title+body);
    var location = getLocation(title+body);
    var threadId = mimeMessage.threadId;
    // FIXME: Add test cases
    var requestType = getRequestType(title+body); // FIXME: Maybe just body?

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

    return body;
}

/**
 * Get image from a given MIME Message if there is an image, returns undefined if not.
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getImageFromMime(mimeMessage, messageId) {
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
                messageId: messageId
            }, function(err, result) {
                var encodedImage = result.data;
                imageData = Buffer.from(encodedImage, 'base64');

                // Create file
                // FIXME: Should use different file name in case of conflict!
                fs.writeFile(imageName, imageData, function(err) {});
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
    var matches = [];    

    // FIXME: Better list of punctuations
    text = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
    for(location of locations) {
        if(text.indexOf(location.toLowerCase()) > - 1) { // Substring search
            matches.push(location);
        }
    }

    return matches;
}

/**
 * Insert given entry to the SQLite database
 *
 * @param {Object} entry The entry to be inserted to the database
 */
function insertToDB(entry) {
    db.serialize(function() {
        // FIXME: Dummy Database
        db.run("CREATE TABLE if not exists foodmap_app_offering (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, location_id TEXT, title TEXT, description TEXT, thread_id TEXT, image TEXT)");
        if(typeof entry.image === 'undefined') {
            var stmt = db.prepare("INSERT INTO foodmap_app_offering (timestamp, location_id, title, description, thread_id) VALUES (?, ?, ?, ?, ?)");
            stmt.run(entry.timestamp, entry.location.toString(), entry.food.toString(), entry.body, entry.threadId);
            stmt.finalize();
        }
        else {
            var stmt = db.prepare("INSERT INTO foodmap_app_offering (timestamp, location_id, title, description, thread_id, image) VALUES (?, ?, ?, ?, ?, ?)");
            stmt.run(entry.timestamp, entry.location.toString(), entry.food.toString(), entry.body, entry.threadId, entry.image.name);
            stmt.finalize();
        }
    });
}

/**
 * Delete given entry from the SQLite database
 *
 * @param {Object} entry The entry to be deleted from the database
 */
function deleteFromDB(entry) {
    // If there is an entry with the given ThreadID, Delete
    db.serialize(function() {
        db.run("DELETE FROM foodmap_app_offering WHERE thread_id=(?)", entry.threadId);
    });

    // FIXME: False positive?
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