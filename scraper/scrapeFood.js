#!/usr/bin/env node
/******************************************************************************/
/* scrapeFood.js                                                              */
/* Author: Seung Jae Lee                                                      */
/******************************************************************************/

var scraper = require('./scraper');
var text = "";

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
    text += chunk;
})

process.stdin.on('end', function() {
    process.stdout.write(scraper.getFood(text).join(", "));
})
