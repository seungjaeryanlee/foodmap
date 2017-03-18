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

// read/write access except delete for gmail, and read/write access to calendar
var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-foodmap.json';

// For testing in Mocha
module.exports.formatEmail = formatEmail;
module.exports.getFood = getFood;
module.exports.getLocation = getLocation;

var foods = fs.readFileSync('./data/foods.txt').toString().split('\n');
var locations = fs.readFileSync('./data/locations.txt').toString().split('\n');

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
                    // FIXME: Substring search for freefood email?
                    if(typeof result.payload.headers.find(x => x.name === "Sender") === "undefined"
                    || result.payload.headers.find(x => x.name === "Sender").value !== "Free Food <freefood@princeton.edu>") {
                        return;
                    }

                    email = formatEmail(result); 
                    //console.log(email);

                    // FIXME: Add to database
                });
            }
        } else {
            console.log('No unread message exists');
        }
    });
};

/**
 * Formats email from the API to fit the database specification.
 *
 * @param {Object} email The email to reformat.
 */
function formatEmail(email) {
    // FIXME: Exception for parseInt?
    var timeStamp = new Date(parseInt(email.internalDate));
    var title = email.payload.headers.find(x => x.name === "Subject").value;
    // FIXME: Test cases
    var body;
    if(email.payload.parts[0].body.size != 0) {
        rawBody = email.payload.parts[0].body.data;
        body = Buffer.from(rawBody, 'base64').toString("ascii");
    }
    else if(typeof email.payload.parts[0].parts !== 'undefined' 
         && email.payload.parts[0].parts[0].body.size !=0) {
        rawBody = email.payload.parts[0].parts[0].body.data;
        body = Buffer.from(rawBody, 'base64').toString("ascii");
    }
    else {
        body = "";
    }

    var food = getFood(title+body);
    var location = getLocation(title+body);
    // FIXME: Get Attachment
    var image;

    console.log({timeStamp: timeStamp, location: location, title: title, body: body, food: food});
    return {timeStamp: timeStamp, location: location, title: title, body: body, food: food};
}

/**
 * Get all foods that match the text
 *
 * @param {Object} text The text to search for food
 */
function getFood(text) {
    var matches = [];    

    text = text.toLowerCase();
    for(food of foods) {
        if(text.indexOf(food.toLowerCase()) > - 1) { // Substring search
            matches.push(food);
        }
    }

    return matches.toString();
}

/**
 * Get all locations that match the text
 *
 * @param {Object} text The text to search for locations
 */
function getLocation(text) {
    // FIXME: There should only be one location per email
    var matches = [];    

    text = text.toLowerCase();
    for(location of locations) {
        if(text.indexOf(location.toLowerCase()) > - 1) { // Substring search
            matches.push(location);
        }
    }

    return matches.toString();
}