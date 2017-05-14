/******************************************************************************/
/* scraper.js                                                                 */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This module contains the functions that process the MIME-formatted emails  */
/* from the Gmail API.                                                        */
/******************************************************************************/

var fs = require('fs');

// Constants
const DELETE = 0;
const INSERT = 1;
const PUNCTUATIONS = ['[','.', ',', '\\', '/', '#', '!', '$', '%', '^', '&',
                      '*', ';', ':', '{', '}', '=', '-', '_', '`', '~', '(',
                      ')', ']', '\'', '?', '<', '>','+', '='];
const TOO_LONG_FOR_FOOD = 5; // No food with 5 or more words
const FREEFOOD_FOOTER = '-----\r\nYou are receiving this email because you are subscribed to the Free Food mailing list, operated by the USG. If you have questions or are having difficulties with this listserv, please send an email to usg@princeton.edu.\r\n\r\nIn your message to the freefood listserv, please state what type of food it is, where it is, until when it will be available and how delicious it is.\r\n\r\nTo unsubscribe, please email listserv@princeton.edu the line UNSUBSRIBE FREEFOOD in the body of the message. Please be sure to remove your e-mail signature (if any) before you send that message.\r\n';
const NOT_FOUND = -1;

// For testing in Mocha
module.exports.formatEmail = formatEmail;
module.exports.getImageFromMime = getImageFromMime;
module.exports.getTimestampFromMime = getTimestampFromMime;
module.exports.getTitleFromMime = getTitleFromMime;
module.exports.getBodyFromMime = getBodyFromMime;
module.exports.getFood = getFood;
module.exports.getLocation = getLocation;
module.exports.getRequestType = getRequestType;
module.exports.listCheck = listCheck;

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
 * @return {Object} entry The object that contains parsed information.
 */
function formatEmail(mimeMessage, messageId) {
    var timestamp = getTimestampFromMime(mimeMessage);
    var title = getTitleFromMime(mimeMessage);
    var body = getBodyFromMime(mimeMessage);
    var image = getImageFromMime(mimeMessage);
    var food = getFood(title+body).join(', ');
    var location = getLocation(title+body);
    var threadId = mimeMessage.threadId;
    var requestType = getRequestType(body);

    return {timestamp: timestamp, location: location, title: title, body: (title + '\n' + body), food: food, image: image, threadId: threadId, requestType: requestType};
}

/**
 * Get first image from a given MIME Message if there are images, returns undefined if not.
 *
 * @param {Object} mimeMessage The MIME message to parse.
 * @return {Object} The object containing the name and id of the first image.
 */
function getImageFromMime(mimeMessage) {
    // Content-Type: multipart/mixed
    if(mimeMessage.payload.mimeType === 'multipart/mixed') {
        if(typeof mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/") === 'undefined') {
            return undefined;
        }
        else {
            var imageName = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").filename;
            var imageId = mimeMessage.payload.parts.find(x => x.mimeType.substring(0, 6) === "image/").body.attachmentId;

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
 * @param {Object} text The text to be cleaned.
 * @return {string} newText The text lowercased and stripped off of punctuations.
 */
function prepareText(text) {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"");
}

/**
 * Get timestamp from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 * @return {string} date The ISO-format string of the time the message was sent.
 */
function getTimestampFromMime(mimeMessage) {
    return new Date(parseInt(mimeMessage.internalDate)).toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Get title (subject) from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 * @return {string} title The title of the message.
 */
function getTitleFromMime(mimeMessage) {
    return mimeMessage.payload.headers.find(x => x.name === "Subject").value;
}

/**
 * Get body from a given MIME Message
 *
 * @param {Object} mimeMessage The MIME message to parse.
 * @return {string} body The body of the message.
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
        body = "";
    }

    /* Delete FreeFood footer */
    body = body.replace(FREEFOOD_FOOTER, '');

    /* Delete null character 0x00 */
    body = body.replace(/\0/g, '');

    return body;
}

/**
 * Check if the given text is a valid food word/phrase
 *
 * @param {Object} text The text to be checked.
 * @return {Boolean} isValid Whether given text is valid.
 */
function isValidFood(text) {
    // Exact Match
    if(foods.indexOf(text) != NOT_FOUND) { return true; }

    // Plural Form
    if(text.slice(-1) == 's' && foods.indexOf(text.slice(0, -1)) != NOT_FOUND) { return true; }
    if(text.slice(-2) == 'es' && foods.indexOf(text.slice(0, -2)) != NOT_FOUND) { return true; }

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
 * @param {Object} text The text to search for food.
 * @return {Array} foods Array of foods found in the text.
 */
function getFood(text) {
    // Clean text and separate by whitespace
    words = prepareText(text).split(/[\s,]+/g);

    var matches = [];

    for(var i = 0; i < words.length; i++) {
        var phraseFound = false;
        word = words[i];

        // Check if the word is part of a phrase
        for(food of foods) {
            splitFood = food.split(" ");
            if(splitFood.length > 1 && splitFood.indexOf(word) != NOT_FOUND) {
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

    matches = matches.concat(listCheck(text));

    // Delete duplicate entries
    return matches.filter(function(item, pos) { return matches.indexOf(item) == pos; });

}

/**
 * Parse location from text and return official location name
 *
 * @param {Object} text The text to search for location.
 * @return {text} location The location found from the text.
 */
function getLocation(text) {
    var location = "";
    var aliasLength = 0;

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
 * @param {number} type The request type of the text. Should be INSERT or DELETE.
 */
function getRequestType(text) {
    text = prepareText(text);
    var deleteRequests = ["all gone"];
    for(req of deleteRequests) {
        if(text.indexOf(req) != NOT_FOUND) {
            return DELETE;
        }
    }
    return INSERT;
}

/**
 * Checks if there is a list of food and returns foods in the list
 *
 * @param {Object} text The text to be inspected.
 * @return {Array} foods Array of foods found through checking lists in the text.
 */
function listCheck(text) {
    var chunks = text.toLowerCase().split(/,| and | or /g);
    chunks = chunks.filter(Boolean); // delete empty strings in chunks
    var canBeFood = Array(chunks.length).fill(true);
    var isFood = Array(chunks.length).fill(false);

    // Label chunks
    for (i = 0; i < chunks.length; i++) {
        chunks[i] = chunks[i].trim();

        // if it has punctuation, ignore
        for(punctuation of PUNCTUATIONS) {
            if(chunks[i].indexOf(punctuation) != NOT_FOUND) {
                canBeFood[i] = false;
                break;
            }
        }
        if(chunks[i].indexOf('\n') != NOT_FOUND) {
            canBeFood[i] = false;
        }

        // if the chunk has too many words, it cannot be food
        else if(chunks[i].split(/\s/).length >= TOO_LONG_FOR_FOOD) {
            canBeFood[i] = false;
        }


        // find list with food
        for (food of foods) {
            if(isValidFood(chunks[i])) {
                isFood[i] = true;
                break;
            }
        }    
    }
    
    var matches = [];
    var listStart = NOT_FOUND;
    var listEnd = NOT_FOUND;

    // Find list pattern by iterating through chunks
    for (i = 0; i < chunks.length; i++) {
        if(listStart == NOT_FOUND && isFood[i]) {
            listStart = i;
        }
        if(listStart != NOT_FOUND && !canBeFood[i]) {
            listEnd = i;
        }

        // If the list ends with the text, make sure that list is parsed
        if(listStart != NOT_FOUND && i == chunks.length - 1) { listEnd = i; }

        // Found a complete list 
        if(listStart != NOT_FOUND && listEnd != NOT_FOUND) {
            // Inner elements can be added safely
            for (j = listStart; j < listEnd; j++) {
                matches.push(capitalize(chunks[j]));
            }

            // Ending elements should be treated separately
            // Start of list: food word/phrase should be at the end of chunk
            if(listStart > 0) {
                tokens = chunks[listStart-1].split(/\b/);
                tokens = tokens.filter(function(val) { return /\S/.test(val); });
                while(tokens.length > 0) {
                    if(isValidFood(tokens.join(" "))) {
                        matches.push(capitalize(tokens.join(" ")));
                        break;
                    }
                    tokens.shift(); // delete first element
                }    
            }

            // End of list: food word/phrase should be located in the beginning of chunk            
            tokens = chunks[listEnd].split(/\b/);
            tokens = tokens.filter(function(val) { return /\S/.test(val); });
            while(tokens.length > 0) {
                if(isValidFood(tokens.join(" "))) {
                    matches.push(capitalize(tokens.join(" ")));
                    break;
                }
                tokens.pop(); // delete last element
            }

            // Reset list
            listStart = NOT_FOUND;
            listEnd = NOT_FOUND;
        }
    }

    return matches;
}
