/******************************************************************************/
/* scraper.js                                                                 */
/* Author: Seung Jae Lee                                                      */
/* Parts of code from                                                         */
/* https://developers.google.com/google-apps/calendar/quickstart/node         */
/******************************************************************************/

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// Constants
const DELETE = 0;
const INSERT = 1;

// For testing in Mocha
module.exports.formatEmail = formatEmail;
module.exports.getImageFromMime = getImageFromMime;
module.exports.getTimestampFromMime = getTimestampFromMime;
module.exports.getTitleFromMime = getTitleFromMime;
module.exports.getBodyFromMime = getBodyFromMime;
module.exports.getFood = getFood;
module.exports.getLocation = getLocation;
module.exports.getRequestType = getRequestType;
module.exports.DELETE = DELETE;
module.exports.INSERT = INSERT;

// Data files
var foods = fs.readFileSync(__dirname + '/data/foods.txt').toString().split('\n');
var locations = fs.readFileSync(__dirname + '/data/locationMap.txt').toString().split('\n');
var regexes = fs.readFileSync(__dirname + '/data/regexMap.txt').toString().split('\n');

// Extract data from files
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

    return {timestamp: timestamp, location: location, title: title, body: (title + '\n' + body), food: food, image: image, threadId: threadId, requestType: requestType};
}

/**
 * Get image from a given MIME Message if there is an image, returns undefined if not.
 *
 * @param {Object} mimeMessage The MIME message to parse.
 */
function getImageFromMime(mimeMessage) {
    // FIXME: Other content types?
    // Content-Type: multipart/mixed
    if(mimeMessage.payload.mimeType === 'multipart/mixed') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/") === 'undefined') {
            return undefined;
        }
        else {
            var imageName = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").filename;
            var imageId = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").body.attachmentId;
            
            // FIXME: Name not needed?
            return {name: imageName, id: imageId};
        }
    }
    else {
        return undefined;
    }
}

/**
 * Prepares text to be parsed by lowercasing and deleting punctuations
 *
 * @param {Object} text The text to be cleaned
 */
function prepareText(text) {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
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
 * Check if the given text is a valid food word/phrase
 *
 * @param {Object} text The text to be checked
 */
function isValidFood(text) {
    // Exact Match
    if(foods.indexOf(text) > -1) { return true; }

    // Plural Form
    if(text.slice(-1) == 's' && foods.indexOf(text.slice(0, -1)) > -1) { return true; }
    if(text.slice(-2) == 'es' && foods.indexOf(text.slice(0, -2)) > -1) { return true; }

    // FIXME: Fuzzy Matching

    return false;
}

/**
 * Capitalize the first letter of the text
 *
 * @param {Object} text The text to be changed
 */
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Get all foods that are in the text
 *
 * @param {Object} text The text to search for food
 */
function getFood(text) {
    // Clean text and separate by whitespace
    // FIXME: magic string should be avoided
    text = text.toLowerCase().replace(/[.\/#!$%\^&\*;:{}=\-_`~()']/g,"");
    words = text.split(/[\s,]+/g);

    var matches = [];

    for(var i = 0; i < words.length; i++) {
        var phraseFound = false;
        word = words[i];
        
        // Check if the word is part of a phrase
        for(food of foods) {
            splitFood = food.split(" ");
            // FIXME: Check for Plural?
            if(splitFood.length > 1 && splitFood.indexOf(word) > -1) {
                // Check boundary
                if(i + splitFood.length > words.length) { continue; }

                // Create phrase
                phrase = [word];
                for(var j = 1; j < splitFood.length; j++) {
                    phrase.push(words[i+j]);
                }
                phraseString = phrase.join(" ");

                if(isValidFood(phraseString)) {                    
                    matches.push(capitalize(phraseString));
                    i += splitFood.length - 1; // Increment index to skip over the phrase
                    phraseFound = true;
                    break;
                }
            }
        }
        if(phraseFound) { continue; }

        if(isValidFood(word)) {
            matches.push(capitalize(word));
        }
    }
    return matches;
}

/**
 * Parse location from text and return official location name
 *
 * @param {Object} text The text to search for location
 */
function getLocation(text) {
    // FIXME: There should only be one location per email
    var location = "";
    var aliasLength = 0;

    // FIXME: Better list of punctuations
    text = prepareText(text);
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
    text = prepareText(text);
    var deleteRequests = ["all gone"];
    for(req of deleteRequests) {
        if(text.indexOf(req) > -1) {
            return DELETE;
        }
    }
    return INSERT;
}
