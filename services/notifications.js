require('dotenv').config();
const { Expo } = require('expo-server-sdk');
const { ethers } = require('ethers');
const database = require('../database');
const infuraProvider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API_KEY);

const listenForNotifications = () => {
    database.connection.getConnection( (err, connection) => {
        if (err) {
            console.log(`Database Error: ${err.message}`);
            throw(`Database Error: ${err.message}`);
        } else {
            connection.query('SELECT address FROM user', (err, rows, fields) => {
                if (err) {
                    console.log(`Query Error: ${err.message}`);
                    throw(`Query Error: ${err.message}`);
                } else {
                    for (let addr of rows) {
                        //Listen to Blockchain balance update
                        addAddressToQueue(addr.address);
                    }
                }
            })
        }
        connection.release();
    })
}

const addAddressToQueue = address => {
    try{
        infuraProvider.on(address, (balance) => {
            sendNotifications(address, {"type" : "balance_updated", "title" : "Balance Updated:", "body" : balance})
        });
    } catch(err) {
        console.log(`Infura Error: ${err.message}`);
        throw(`Infura Error: ${err.message}`);
    }
}

const sendNotifications = async (address, data) => {
    // Create a new Expo SDK client
    let expo = new Expo();
    // Create the messages that you want to send to clents
    database.connection.getConnection( (err, connection) => {
        if (err) {
            console.log(`Database Error: ${err.message}`);
            throw(`Database Error: ${err.message}`);
        } else {
            connection.query('SELECT token FROM user WHERE address = ?',[address], (err, rows, fields) => {
                if (err) {
                    console.log(`Query Error: ${err.message}`)
                    throw(`Query Error: ${err.message}`);
                } else {
                    let messages = [];
                    for (let pushToken of rows) {
                        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
                        // Check that all your push tokens appear to be valid Expo push tokens
                        if (!Expo.isExpoPushToken(pushToken.token)) {
                            console.error(`Push token ${pushToken.token} is not a valid Expo push token`);
                            continue;
                        }

                        // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
                        messages.push({
                            to: pushToken.token,
                            sound: 'default',
                            //body: "Balance Updated"
                            title: data.type === "balance_updated" ? data.title : null,
                            body: data.type === "balance_updated" ? parseFloat(ethers.utils.formatEther ( data.body )).toFixed(6).replace(/\.?0+$/, "") : null,
                        })
                    }

                    // The Expo push notification service accepts batches of notifications so
                    // that you don't need to send 1000 requests to send 1000 notifications. We
                    // recommend you batch your notifications to reduce the number of requests
                    // and to compress them (notifications with similar content will get
                    // compressed).
                    console.log(messages)
                    let chunks = expo.chunkPushNotifications(messages);
                    let tickets = [];
                    (async () => {
                    // Send the chunks to the Expo push notification service. There are
                    // different strategies you could use. A simple one is to send one chunk at a
                    // time, which nicely spreads the load out over time:
                    for (let chunk of chunks) {
                        try {
                            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                            console.log(ticketChunk);
                            tickets.push(...ticketChunk);
                            // NOTE: If a ticket contains an error code in ticket.details.error, you
                            // must handle it appropriately. The error codes are listed in the Expo
                            // documentation:
                            // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    })();
                }
            });
        }
        connection.release();
    })
}

module.exports = {
    listenForNotifications,
    addAddressToQueue
}
