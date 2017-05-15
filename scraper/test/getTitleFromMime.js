/******************************************************************************/
/* getTitleFromMime.js                                                        */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This is a mocha test file that tests getTitleFromMime() function in        */
/* scraper.js.                                                                */
/******************************************************************************/

var assert = require("assert");
var scraper = require('../scraper.js');

describe('getTitleFromMime()', function() {
    it('getTitleFromMime() should return empty string from email with no title', function() {
        var message = 
        {
            "id": "15b0571441398942",
            "threadId": "15b0571441398942",
            "labelIds": [
                "UNREAD",
                "IMPORTANT",
                "SENT",
                "INBOX"
            ],
            "snippet": "This has no title",
            "historyId": "3503",
            "internalDate": "1490444961000",
            "payload": {
                "mimeType": "multipart/alternative",
                "filename": "",
                "headers": [
                    {
                        "name": "MIME-Version",
                        "value": "1.0"
                    },
                    {
                        "name": "Subject",
                        "value": ""
                    }
                ],
                "body": {
                    "size": 0
                },
                "parts": [
                    {
                        "partId": "0",
                        "mimeType": "text/plain",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "text/plain; charset=UTF-8"
                            }
                        ],
                        "body": {
                            "size": 19,
                            "data": "VGhpcyBoYXMgbm8gdGl0bGUNCg=="
                        }
                    },
                    {
                        "partId": "1",
                        "mimeType": "text/html",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "text/html; charset=UTF-8"
                            }
                        ],
                        "body": {
                            "size": 40,
                            "data": "PGRpdiBkaXI9Imx0ciI-VGhpcyBoYXMgbm8gdGl0bGU8L2Rpdj4NCg=="
                        }
                    }
                ]
            },
            "sizeEstimate": 662
        };
        var title = scraper.getTitleFromMime(message);
        assert.equal(title, "");
    })
    it('getTitleFromMime() should return title from email with a title', function() {
        var message = 
        {
            "id": "15b0583530611491",
            "threadId": "15b0583530611491",
            "labelIds": [
                "UNREAD",
                "IMPORTANT",
                "SENT",
                "INBOX"
            ],
            "snippet": "",
            "historyId": "3688",
            "internalDate": "1490446144000",
            "payload": {
                "mimeType": "multipart/alternative",
                "filename": "",
                "headers": [
                    {
                        "name": "MIME-Version",
                        "value": "1.0"
                    },
                    {
                        "name": "Subject",
                        "value": "This is the title"
                    }
                ],
                "body": {
                    "size": 0
                },
                "parts": [
                    {
                        "partId": "0",
                        "mimeType": "text/plain",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "text/plain; charset=UTF-8"
                            }
                        ],
                        "body": {
                            "size": 2,
                            "data": "DQo="
                        }
                    },
                    {
                        "partId": "1",
                        "mimeType": "text/html",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "text/html; charset=UTF-8"
                            }
                        ],
                        "body": {
                            "size": 27,
                            "data": "PGRpdiBkaXI9Imx0ciI-PGJyPjwvZGl2Pg0K"
                        }
                    }
                ]
            },
            "sizeEstimate": 649
        };
        var title = scraper.getTitleFromMime(message);
        assert.equal(title, "This is the title");
    })
});
