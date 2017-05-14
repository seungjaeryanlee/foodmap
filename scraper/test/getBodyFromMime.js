/******************************************************************************/
/* getBodyFromMime.js                                                         */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This is a mocha test file that tests getBodyFromMime() function in         */
/* scraper.js.                                                                */
/******************************************************************************/

var assert = require("assert");
var scraper = require('../scraper.js');

describe('getBodyFromMime()', function() {
    describe('Content-Type: text/plain', function() {
        it('getBodyFromMime() should return \"\\n\" if the email has only newline', function() {
            var message = 
            {
                "id": "15b05adc690148ae",
                "threadId": "15b05adc690148ae",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "4020",
                "internalDate": "1490448926000",
                "payload": {
                    "partId": "",
                    "mimeType": "text/plain",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 09:35:26 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "Plain text mode"
                        }
                    ],
                    "body": {
                        "size": 2,
                        "data": "DQo="
                    }
                },
                "sizeEstimate": 400
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");;
            assert.equal(body, "\n");
        })
        it('getBodyFromMime() should return the body if the email has a body', function() {
            var message = 
            {
                "id": "15b05b1031c9e462",
                "threadId": "15b05b1031c9e462",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "Plain text body",
                "historyId": "4075",
                "internalDate": "1490449138000",
                "payload": {
                    "partId": "",
                    "mimeType": "text/plain",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 09:38:58 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "Plain text title"
                        }
                    ],
                    "body": {
                        "size": 17,
                        "data": "UGxhaW4gdGV4dCBib2R5DQo="
                    }
                },
                "sizeEstimate": 416
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");;
            assert.equal(body, "Plain text body\n");
        })
    })
    describe('Content-Type: multipart/mixed', function() {
        it('getBodyFromMime() should return \"\\n\" if the email has only newline', function() {
            var message = 
            {
                "id": "15b05c7b400d8e31",
                "threadId": "15b05c7b400d8e31",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "4982",
                "internalDate": "1490450625000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 10:03:45 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "this is subject"
                        },
                        {
                            "name": "Content-Type",
                            "value": "multipart/mixed; boundary=001a11c1178e1b34f6054b8e943a"
                        }
                    ],
                    "body": {
                        "size": 0
                    },
                    "parts": [
                        {
                            "mimeType": "multipart/alternative",
                            "filename": "",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "multipart/alternative; boundary=001a11c1178e1b34f1054b8e9438"
                                }
                            ],
                            "body": {
                                "size": 0
                            },
                            "parts": [
                                {
                                    "partId": "0.0",
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
                                    "partId": "0.1",
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
                        {
                            "partId": "1",
                            "mimeType": "image/png",
                            "filename": "image.png",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/png; name=\"image.png\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"image.png\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0pbtb9q0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ-Wpgx7smX0e6B-MzbtaUTL4umytFjOP0VMBsa7uSOO4J9c4isnQgU_OjNJAC-rx0jcYZlsVTs8hG-quWQEyLPNayUqFoFVPwjzbcAafx5s4qWSfinrvhyUwwaQjjDJgx21mu9lwRCH7RlFcEcQS7-oeEGFnKzTwvgReFsl1yRJCGSk_cWo8bLXlAQ3C4vrl4hYzEqE1F9iMxDY329T1UlSX0aU4ePt30xMTHGOb8GETviNq6nFtbPSZxpKSMKBVDIClnmmAkO8ZT5AnyemtztRPDLSItzGWyl35OHGTfHCC7ABU4HXjiurmLk",
                                "size": 151
                            }
                        }
                    ]
                },
                "sizeEstimate": 1192
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");
            assert.equal(body, "\n");
        })
        it('getBodyFromMime() should return the body if the email has a body', function() {
            var message = 
            {
                "id": "15b05cf0d61049d5",
                "threadId": "15b05cf0d61049d5",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "and this is body",
                "historyId": "5169",
                "internalDate": "1490451106000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 10:11:46 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "this is subject..."
                        }
                    ],
                    "body": {
                        "size": 0
                    },
                    "parts": [
                        {
                            "mimeType": "multipart/alternative",
                            "filename": "",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "multipart/alternative; boundary=001a11c13574c726ae054b8eb0db"
                                }
                            ],
                            "body": {
                                "size": 0
                            },
                            "parts": [
                                {
                                    "partId": "0.0",
                                    "mimeType": "text/plain",
                                    "filename": "",
                                    "headers": [
                                        {
                                            "name": "Content-Type",
                                            "value": "text/plain; charset=UTF-8"
                                        }
                                    ],
                                    "body": {
                                        "size": 18,
                                        "data": "YW5kIHRoaXMgaXMgYm9keQ0K"
                                    }
                                },
                                {
                                    "partId": "0.1",
                                    "mimeType": "text/html",
                                    "filename": "",
                                    "headers": [
                                        {
                                            "name": "Content-Type",
                                            "value": "text/html; charset=UTF-8"
                                        }
                                    ],
                                    "body": {
                                        "size": 39,
                                        "data": "PGRpdiBkaXI9Imx0ciI-YW5kIHRoaXMgaXMgYm9keTwvZGl2Pg0K"
                                    }
                                }
                            ]
                        },
                        {
                            "partId": "1",
                            "mimeType": "image/png",
                            "filename": "image.png",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/png; name=\"image.png\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"image.png\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0pc3o5s0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ9Ds1TDXJRsJkDA7lD6MwQOG4c5gz0ylE926u3ezV5I_Tm8A8hovPoscraperxP0qXQytUTvmziGe6e30z0G-inSFoeAcWWHe6CgHJwrxPtVC3yqlmpstRajqhpvLtHKZVvU9rfytvGtnvN7pFHuDjtr0s8ts4U8AjKhZR7cwFZszFkQkwaR9AmLKqfp3MqUl6Ylgl-WmjeRbHbZ0T7vS7TLw7sbEjfTZTQb3x8zUHaVwkOI7eSds8qNFOnKH2qXnorsrzQST4eF_tTjCG7u-MRkO_0pweYkb7TJsG-FH4oH_yI1e3ZFDUepe2ZICA",
                                "size": 151
                            }
                        }
                    ]
                },
                "sizeEstimate": 1223
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");
            assert.equal(body, "and this is body\n");
        })
    })
    describe('Content-Type: multipart/alternative', function() {
        it('getBodyFromMime() should return \"\\n\" if the email has only newline', function() {
            var message = 
            {
                "id": "15b05b77c9d54e43",
                "threadId": "15b05b77c9d54e43",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "4472",
                "internalDate": "1490449563000",
                "payload": {
                    "mimeType": "multipart/alternative",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 09:46:03 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "Alternative title"
                        },
                        {
                            "name": "Content-Type",
                            "value": "multipart/alternative; boundary=001a1139a48ac42f0f054b8e548e"
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
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n"); // Change line ending
            assert.equal(body, "\n");
        })
        it('getBodyFromMime() should return the body if the email has a body', function() {
            var message = 
            {
                "id": "15b05b9c57e6829c",
                "threadId": "15b05b9c57e6829c",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "Multipart Alternative Body",
                "historyId": "4585",
                "internalDate": "1490449712000",
                "payload": {
                    "mimeType": "multipart/alternative",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 09:48:32 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "Multipart Alternative Text"
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
                                "size": 28,
                                "data": "TXVsdGlwYXJ0IEFsdGVybmF0aXZlIEJvZHkNCg=="
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
                                "size": 53,
                                "data": "PGRpdiBkaXI9Imx0ciI-TXVsdGlwYXJ0IEFsdGVybmF0aXZlIEJvZHk8YnI-PC9kaXY-DQo="
                            }
                        }
                    ]
                },
                "sizeEstimate": 710
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n"); // Change line ending
            assert.equal(body, "Multipart Alternative Body\n");
        })
    })
    describe('Content-Type: multipart/related', function() {
        // FIXME: Check if this is possible or not
        // it('getBodyFromMime() should return \"\\n\" if the email has only newline', function() {
        //     var message = {};
        //     var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");
        //     assert.equal(body, "");
        // })
        it('getBodyFromMime() should return the body if the email has a body', function() {
            var message = 
            {
                "id": "15b05c08fdd4c3e8",
                "threadId": "15b05c08fdd4c3e8",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "Related Body",
                "historyId": "4896",
                "internalDate": "1490450157000",
                "payload": {
                    "mimeType": "multipart/related",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Date",
                            "value": "Sat, 25 Mar 2017 09:55:57 -0400"
                        },
                        {
                            "name": "Subject",
                            "value": "Related Subject"
                        }
                    ],
                    "body": {
                        "size": 0
                    },
                    "parts": [
                        {
                            "mimeType": "multipart/alternative",
                            "filename": "",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "multipart/alternative; boundary=001a11c15dca2e9694054b8e78a9"
                                }
                            ],
                            "body": {
                                "size": 0
                            },
                            "parts": [
                                {
                                    "partId": "0.0",
                                    "mimeType": "text/plain",
                                    "filename": "",
                                    "headers": [
                                        {
                                            "name": "Content-Type",
                                            "value": "text/plain; charset=UTF-8"
                                        }
                                    ],
                                    "body": {
                                        "size": 39,
                                        "data": "UmVsYXRlZCBCb2R5DQpbaW1hZ2U6IElubGluZSBpbWFnZSAxXQ0K"
                                    }
                                },
                                {
                                    "partId": "0.1",
                                    "mimeType": "text/html",
                                    "filename": "",
                                    "headers": [
                                        {
                                            "name": "Content-Type",
                                            "value": "text/html; charset=UTF-8"
                                        }
                                    ],
                                    "body": {
                                        "size": 125,
                                        "data": "PGRpdiBkaXI9Imx0ciI-UmVsYXRlZCBCb2R5PGRpdj48aW1nIHNyYz0iY2lkOmlpXzE1YjA1YzA2YWVhMmRkZWQiIGFsdD0iSW5saW5lIGltYWdlIDEiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI-PC9kaXY-PC9kaXY-DQo="
                                    }
                                }
                            ]
                        },
                        {
                            "partId": "1",
                            "mimeType": "image/png",
                            "filename": "image.png",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/png; name=\"image.png\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "inline; filename=\"image.png\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "Content-ID",
                                    "value": "<ii_15b05c06aea2dded>"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "ii_15b05c06aea2dded"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ_NypVDu8tRVlrRha5Scoq65W77RJlIGcicTuKaQJ7rMI0wqHCkoxjawXWt4pm_Fn4MzwPA4d-mAHYqHYm0iFeMSVfmG7wTZTalbirpmI9Fg_R856rj9wveIXSG1EPnOAfYo5_JDPd1Fw9YKNmwQWjOGOhrsGeQxYaNl0KbpvVhWWHeNGERufnO6Hi3diTEXLABmuZdo2ZR2c8jMZjbJQIAHOJhVigeRa8Mj4JlV8BLqMDA0onSD6lvSH41PYX9eqQ5RdDMy5QO4nU9ITnuJcAXlBhyuP7XEqWxhzgOPMzkZvdC114yE63QzHI",
                                "size": 151
                            }
                        }
                    ]
                },
                "sizeEstimate": 1368
            };
            var body = scraper.getBodyFromMime(message).replace(/\r\n/g, "\n");
            assert.equal(body, "Related Body\n[image: Inline image 1]\n"); 
        })
    })
});

