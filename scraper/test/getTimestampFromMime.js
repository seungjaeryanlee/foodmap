var assert = require("assert");
var app = require('../app.js');

describe('getTimestampFromMime()', function() {
    it('getTimestampFromMime() should return email was sent in datetime format', function() {
        var message = 
        {
		    "id": "15b058637c3f3884",
		    "threadId": "15b058637c3f3884",
		    "labelIds": [
		        "UNREAD",
		        "IMPORTANT",
		        "SENT",
		        "INBOX"
		    ],
		    "snippet": "",
		    "historyId": "3790",
		    "internalDate": "1490446333000",
		    "payload": {
		        "mimeType": "multipart/alternative",
		        "filename": "",
		        "headers": [
		            {
		                "name": "MIME-Version",
		                "value": "1.0"
		            },
		            {
		                "name": "Received",
		                "value": "by 10.140.83.176 with HTTP; Sat, 25 Mar 2017 05:52:13 -0700 (PDT)"
		            },
		            {
		                "name": "Date",
		                "value": "Sat, 25 Mar 2017 08:52:13 -0400"
		            },
		            {
		                "name": "Delivered-To",
		                "value": "foodmap333@gmail.com"
		            },
		            {
		                "name": "Message-ID",
		                "value": "<CAEhqU+FRnG2eFYX6e27gdpYYeQ0HneMZd9L7HNOBJ4DXTkZJTQ@mail.gmail.com>"
		            },
		            {
		                "name": "Subject",
		                "value": "This was sent in Mar 25, 2017 at 8:52 am EDT"
		            },
		            {
		                "name": "From",
		                "value": "Ryan Lee <foodmap333@gmail.com>"
		            },
		            {
		                "name": "To",
		                "value": "Ryan Lee <foodmap333@gmail.com>"
		            },
		            {
		                "name": "Content-Type",
		                "value": "multipart/alternative; boundary=001a113a5b44485926054b8d94b0"
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
		    "sizeEstimate": 676
		};
        var timestamp = app.getTimestampFromMime(message);
        assert.equal(timestamp, "2017-03-25 12:52:13");
    })
});