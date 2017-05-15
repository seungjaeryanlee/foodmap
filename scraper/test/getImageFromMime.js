/******************************************************************************/
/* getImageFromMime.js                                                        */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This is a mocha test file that tests getImageFromMime() function in        */
/* scraper.js.                                                                */
/******************************************************************************/

var assert = require("assert");
var scraper = require('../scraper.js');

describe('getImageFromMime()', function() {
    describe('no attachment in message', function() {
        it('if there is no attachment, getImageFromMime() should return undefined', function() {
            var message = 
            {
                "id": "15b191f7a6d6bec4",
                "threadId": "15b191f7a6d6bec4",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "7081",
                "internalDate": "1490775145000",
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
                            "value": "No attachment"
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
                "sizeEstimate": 645
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image, undefined);
        })
    })
    describe('no image attachment in message', function() {
        it('if there is no image attachment, getImageFromMime() should return undefined', function() {
            var message = 
            {
                "id": "15b191d06c1bc62e",
                "threadId": "15b191d06c1bc62e",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "7025",
                "internalDate": "1490774984000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample txt"
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
                                    "value": "multipart/alternative; boundary=001a11c13b605ffa3b054bda19c3"
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
                            "mimeType": "text/plain",
                            "filename": "sample.txt",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "text/plain; charset=US-ASCII; name=\"sample.txt\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.txt\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uoxelv0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ8LCzcsUUm7Rk4CQ_IUeqA6QVWNWmRsWP7GkNizqZ7Et0dCA-rgcNK2xsKgUeeoezcmyqKIx5YDdzO85AWNOMW0TPvoynULtnGQwe8FoUkac6h1_mpjmEAoo3uXKnkNStBx3nvXoKRrO5RRso7MZ7CWkEqRZ8q9PIIXibNs6g4WdUhKLKiKwY_15bfGL-K38ke-fO_9l-_kDJxjOAk61696KR1NWwcsEyYiwGlj420Ij76Fnwia8Q0ETvvGi0DrV1Ka-WHkBptMZG5RdiqN1zNxngHqMHzUeg-HmBlxRPcZHUoajOX509BSIK8",
                                "size": 11
                            }
                        }
                    ]
                },
                "sizeEstimate": 1016
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image, undefined);
        })
    })
    describe('Content-Type: image/jpeg', function() {
        it('filename should be preserved (sample.jpg)', function() {
            var message = 
            {
                "id": "15b191c1ccc3b748",
                "threadId": "15b191c1ccc3b748",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "6680",
                "internalDate": "1490774924000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample jpg"
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
                                    "value": "multipart/alternative; boundary=001a11c1258ad076dd054bda1578"
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
                            "mimeType": "image/jpeg",
                            "filename": "sample.jpg",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/jpeg; name=\"sample.jpg\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.jpg\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uovjow0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ8hd1kFItC_mB2xpuEepjDQ2myBLHZLMro5esAok-CtwD5IRhvENKAZQKBwuRpkjXiutjcySDGlUyHQMY-F4J3p3hukx-vUEAm87zTRwHYFMAMc6QijOAV5IRCN9PozAd0kxVOQH2yPk-eRaFh-d_605VssEU_toftobAMZycn_2uutwjuEQVdPfAzI-dspotI0D87LWDrAZsjEVWTPTgQN7ZbfRNc7H7YnkvuQzpe3QwPr_kYHk5u-hod7y_DgyyljufwKXmTAxA7_ColEQfbgRmvo82uJahvdv9yXgw-vHtzSqFqqfPAbztk",
                                "size": 1495
                            }
                        }
                    ]
                },
                "sizeEstimate": 3030
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image.name, "sample.jpg");
        })
    })
    describe('Content-Type: image/gif', function() {
        it('filename should be preserved (sample.gif)', function() {
            var message = 
            {
                "id": "15b191c9ce99d422",
                "threadId": "15b191c9ce99d422",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "6949",
                "internalDate": "1490774957000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample gif"
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
                                    "value": "multipart/alternative; boundary=001a113a96ccc4a168054bda173f"
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
                            "mimeType": "image/gif",
                            "filename": "sample.gif",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/gif; name=\"sample.gif\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.gif\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uowm6g0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ95vIfak9x0Wo8x8AuDZcf8q1XedPi1zy1WK6G5Rw6xuWeVyInSh_BPPJCEzkyAmsu32aSrdaHuledo8Mn0DsbcKltYhdOBZm1NUOZs6lJ6jHhB1GBuQDoDLvyc_sFBPzXWgKP0f5kRCknnjdyAtFIv1qSPUSWq86HUBNlGsF0djWHxMnR0YsN8jwh3R_1fAlT7HSbZkbgvn-23LKh5WutHfevGHgR28DP4CqFACAWWUvgooVwio3dvrQBLDdWE5GmMfor-mFho5VdDjnyBVgn7Gkcs_dlPJG9rwKGiOgNcfUETTU7FoWk9fNg",
                                "size": 856
                            }
                        }
                    ]
                },
                "sizeEstimate": 2155
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image.name, "sample.gif");
        })
    })
    describe('Content-Type: image/png', function() {
        it('filename should be preserved (sample.png)', function() {
            var message = 
            {
                "id": "15b191c98e8a2b53",
                "threadId": "15b191c98e8a2b53",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "6902",
                "internalDate": "1490774956000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample png"
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
                                    "value": "multipart/alternative; boundary=001a11c11bfab7a16f054bda1756"
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
                                        "size": 23,
                                        "data": "PGRpdiBkaXI9Imx0ciI-PC9kaXY-DQo="
                                    }
                                }
                            ]
                        },
                        {
                            "partId": "1",
                            "mimeType": "image/png",
                            "filename": "sample.png",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/png; name=\"sample.png\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.png\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uowjko0"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ_-ppjjpiNNLZhIf7C-PTOTNNR1IRaeNNtyS4xzq-WdvTbbrCpPbnmFmhZV7S_KdLo2lym1I5eriyj1PuxI3gOQ9hooQPoUR1rrgaCosmBjdyEHcGtki69qoRubXm5Bwof1XdpFxHYSUhPENvjMaWb9FV1cYg9YWJBEClid3jsmsn7wSG-PHU4imyiugRrLGPwqJNVBAmroW_tlMDBXZwzVRu8V5Z8Sfi6V1KsM3hABLB-rmJowktkzijRTRSreO86Q1g5ykxIPlqoSCL9H1qrAv8kPaHAf9wxCUnPaMWoJAgoO90JCpAkHjh8",
                                "size": 157
                            }
                        }
                    ]
                },
                "sizeEstimate": 1193
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image.name, "sample.png");
        })
    })
    describe('Content-Type: image/tiff', function() {
        it('filename should be preserved (sample.tif)', function() {
            var message = 
            {
                "id": "15b191c23b745a19",
                "threadId": "15b191c23b745a19",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "6775",
                "internalDate": "1490774925000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample tif"
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
                                    "value": "multipart/alternative; boundary=001a11c0013ee5475a054bda1558"
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
                            "mimeType": "image/tiff",
                            "filename": "sample.tif",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/tiff; name=\"sample.tif\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.tif\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uow4u90"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ8CcyEiKcnv-xofedjWzltC51TvImuQ4ci2ASM0tY1VMbu32ZsJ-kp4RXMjyMofrlZFwq2loO4pJ-qQaDufbjMpYkoHMwTvkqLo6dkTU8bt8-j9qJ0Cysp7I1LtnM3YrvvhVEX4y9ghjtK7urgTmpPaDCXEFzUz3LO7U0ofW446qHQeycU69xsJ4o35fI6MWnLUr2ShPBQG2jD589D6psGW2iZ_9ZvLhBz6kU1qH9Sim_EzJjQ_OIPsl9yobhsk8xcHjK0i8OrUjWajktHQytltALqP8y6qzJvSQfdDMQyG0bYS4BuJ1xeMxHk",
                                "size": 1498
                            }
                        }
                    ]
                },
                "sizeEstimate": 3034
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image.name, "sample.tif");
        })
    })
    describe('Content-Type: image/bmp', function() {
        it('filename should be preserved (sample.bmp)', function() {
            var message = 
            {
                "id": "15b191c1ed85d6a1",
                "threadId": "15b191c1ed85d6a1",
                "labelIds": [
                    "UNREAD",
                    "IMPORTANT",
                    "SENT",
                    "INBOX"
                ],
                "snippet": "",
                "historyId": "6728",
                "internalDate": "1490774925000",
                "payload": {
                    "mimeType": "multipart/mixed",
                    "filename": "",
                    "headers": [
                        {
                            "name": "MIME-Version",
                            "value": "1.0"
                        },
                        {
                            "name": "Subject",
                            "value": "Sample bmp"
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
                                    "value": "multipart/alternative; boundary=001a1134e9b8db5420054bda1545"
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
                            "mimeType": "image/bmp",
                            "filename": "sample.bmp",
                            "headers": [
                                {
                                    "name": "Content-Type",
                                    "value": "image/bmp; name=\"sample.bmp\""
                                },
                                {
                                    "name": "Content-Disposition",
                                    "value": "attachment; filename=\"sample.bmp\""
                                },
                                {
                                    "name": "Content-Transfer-Encoding",
                                    "value": "base64"
                                },
                                {
                                    "name": "X-Attachment-Id",
                                    "value": "f_j0uovp660"
                                }
                            ],
                            "body": {
                                "attachmentId": "ANGjdJ-bhQ1Fu6MyEeJlS2suGMok891Z51Acv9j1ot7XhOwKVx6qnKLrgGl2MNTDHkKJ0Kf0p48Qub37GX69kS6VBgFDUU-wL0sN6yJHeWgUo3mlbq5WCayB6sgDeKUCAA9FCwyREwUv-m-KlUWvNE1ZWr-2jM6jEnJRKCYOPzG7t8X2qZQTf65cNarP0VdCd0_WpxMsZIvOwZ-Jnl4hR_ix5sCseCAX-WNcUssVhyzA73JY04nfqbGTKNNkuv2YBxZStuiyWUGz6k0D5eS9wtP5SFYxsj94G2b4TIgU4Vd3vBEYTG79FHF2H6RWELY",
                                "size": 3126
                            }
                        }
                    ]
                },
                "sizeEstimate": 5257
            };
            var image = scraper.getImageFromMime(message);
            assert.equal(image.name, "sample.bmp");
        })
    })
});