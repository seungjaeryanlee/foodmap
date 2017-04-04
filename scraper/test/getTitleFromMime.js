var assert = require("assert");
var app = require('../app.js');

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
                        "name": "Received",
                        "value": "by 10.140.83.176 with HTTP; Sat, 25 Mar 2017 05:29:21 -0700 (PDT)"
                    },
                    {
                        "name": "Date",
                        "value": "Sat, 25 Mar 2017 08:29:21 -0400"
                    },
                    {
                        "name": "Delivered-To",
                        "value": "foodmap333@gmail.com"
                    },
                    {
                        "name": "Message-ID",
                        "value": "<CAEhqU+HrcbcWkNFnC-z_NOSn9oyaD_YZdKUS5q=5KASZgMpkhw@mail.gmail.com>"
                    },
                    {
                        "name": "Subject",
                        "value": ""
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
                        "value": "multipart/alternative; boundary=001a11c16ff475c960054b8d4269"
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
        var title = app.getTitleFromMime(message);
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
                        "name": "Received",
                        "value": "by 10.140.83.176 with HTTP; Sat, 25 Mar 2017 05:49:04 -0700 (PDT)"
                    },
                    {
                        "name": "Date",
                        "value": "Sat, 25 Mar 2017 08:49:04 -0400"
                    },
                    {
                        "name": "Delivered-To",
                        "value": "foodmap333@gmail.com"
                    },
                    {
                        "name": "Message-ID",
                        "value": "<CAEhqU+Fz9mcDpGaAQd-c8LdfeH796_SNcf6_xG=8_wgUeWxBZA@mail.gmail.com>"
                    },
                    {
                        "name": "Subject",
                        "value": "This is the title"
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
                        "value": "multipart/alternative; boundary=001a113abf12fa5251054b8d880f"
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
        var title = app.getTitleFromMime(message);
        assert.equal(title, "This is the title");
    })
});
