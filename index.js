
'use strict';

const Twilio = require('twilio');
const firebase = require('firebase');
const express = require('express');
const port = 3000
app = express(); 


let images = [];
let phrases = [];

const firebaseConfig = {
    "apiKey": process.env.FIREBASE_API_KEY,
    "authDomain": process.env.FIREBASE_AUTH_DOMAIN,
    "databaseURL": process.env.FIREBASE_DATABASE_URL,
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "storageBucket": process.env.FIREBASE_STORAGE_BUCKET,
    "messagingSenderId": process.env.FIREBASE_MESSAGE_SENDER_ID
}

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

function initializeFirebase() {
    firebase.initializeApp(firebaseConfig);

    const imageBucket = firebase.database().ref('images')
    const phraseBucket = firebase.database().ref('phrases')
    imageBucket.once('value', (snap) => {
        images = snap.val();
    });

    phraseBucket.once('value', (snap) => {
        phrases = snap.val();
    });
}

const getRandomImage = () => {
    const ran = getRandomInt(0, images.length - 1);
    return images[ran];
}

const getRandomPhrase = () => {
    const ran = getRandomInt(0, phrases.length - 1);
    return phrases[ran];
}

const sendNotifications = (formData) =>  {
    const client = new Twilio(twilioAccountSid, twilioAuthToken);

        // Create options to send the message
        const options = {
            to: `+ ${formData.phoneNumber}`,
            from: twilioPhoneNumber,
            /* eslint-disable max-len */
            body: getRandomPhrase(),
            mediaUr: getRandomImage()
            /* eslint-enable max-len */
        };

        // Send the message!
        client.messages.create(options, function(err, response) {
            if (err) {
                // Just log it for now
                console.error(err);
            } else {
                // Log the last few digits of a phone number
                let masked = formData.phoneNumber.substr(0,formData.phoneNumber.length - 5);
                masked += '*****';
                console.log(`Message sent to ${masked}`);
            }
    });

    // Don't wait on success/failure, just indicate all messages have been
    // queued for delivery
    if (callback) {
      callback.call();
    }
}

app.post('/messager', function (req, res) {
    console.log(req)
    res.send('POST request to homepage');
});

initializeFirebase();
app.listen(port);
