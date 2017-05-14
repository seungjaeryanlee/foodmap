/******************************************************************************/
/* app.js                                                                     */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* The main program that runs the scraper. It runs the email scraper, and if  */
/* there are unread emails, processes them and alters the database.           */
/******************************************************************************/

var fs = require('fs');
var google = require('googleapis');
var db_module = require('./db');
var oauth = require('./oauth');
var scraper = require('./scraper');

const PROJECT_MODE_ERROR = 'Error: PROJECT_MODE not set. Cannot set up \
database. Did you activate the virtual environment in the Django project?';

// Pick database implementation (sqlite/postgres) based on environment variable
// PROJECT_MODE
var db;
if (process.env.PROJECT_MODE === 'development') {
    db = db_module.db.sqlite;
} else if (process.env.PROJECT_MODE === 'production') {
    db = db_module.db.postgres;
} else {
    console.error(PROJECT_MODE_ERROR);
    process.exit(1);
}

if(process.env.PROJECT_MODE === 'production') {
    oauth.authorize(JSON.parse(process.env.client_secret), main);
}
else if(process.env.PROJECT_MODE === 'development') {
    // Load client secrets from a local file.
    fs.readFile(__dirname + '/client_secret.json', function(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // main program.
        oauth.authorize(JSON.parse(content), main);
    });
}
else {
    console.error(PROJECT_MODE_ERROR);
    process.exit(1);
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
                    setTimeout(parseEmail, 1000+(1000*index)
                        , res.messages[index].id, markAsRead);
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
 * @param {Function} callback The markAsRead function to be called after parsing
 *  completes
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
        sender = result.payload.headers.find(x => x.name === "Sender");
        if (typeof sender === "undefined"
        || sender.value !== "Free Food <freefood@princeton.edu>") {
            return;
        }

        entry = scraper.formatEmail(result, messageId);
        // saveImage(entry.image, messageId);

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

/**
 * Save first attached image to filesystem / database
 *
 * @param {Object} image The image object containing name and ID of the image.
 * @param {Object} messageId The id of a message with the image.
 */
function saveImage(image, messageId) {

    // Get Attachment
    google.gmail('v1').users.messages.attachments.get({
        userId: 'me',
        id: image.id,
        messageId: messageId
    }, function(err, result) {
        var encodedImage = result.data;
        imageData = Buffer.from(encodedImage, 'base64');

        // FIXME: Divide by PROJECT_MODE
        if(PROJECT_MODE == 'development') {
            // Give new name that won't conflict
            imageExtension = image.name.split('.').pop();
            imageName = messageId + '.' + imageExtension;

            // Create file
            // FIXME: Resize if too big
            fs.writeFile(__dirname + '/' + imageName, imageData, function(err) {
                console.log(err);
            });    
        }
    });
}
