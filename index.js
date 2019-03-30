
'use strict';

const Twilio = require('twilio');
const firebase = require('firebase');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const cors = require('cors')
const port = process.env.PORT || 3000;
const app = express(); 

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


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

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRandomImage = () => {
    const ran = getRandomInt(0, images.length - 1);
    return images[ran];
}

const getRandomPhrase = () => {
    const ran = getRandomInt(0, phrases.length - 1);
    return phrases[ran];
}

const setUpTimeouts = (formData) => {
    const executions = getRandomInt(1, 10);

    const now = moment();
    const then = moment(formData.meetingTime, "h:m a");
    const startTime = now.diff(then, 'seconds');
    const endTime = startTime + (formData.meetingLength * 60);

    for (let i = 0; i < executions; i++) {
        const timeToSend = getRandomInt(startTime, endTime) * 1000;
        setTimeout(() => {
            sendNotifications(formData);
        }, timeToSend);       
    }
}

const sendNotifications = (formData) =>  {
    const client = new Twilio(twilioAccountSid, twilioAuthToken);

        // Create options to send the message
        const options = {
            to: `${formData.phone}`,
            from: twilioPhoneNumber,
            /* eslint-disable max-len */
            body: getRandomPhrase(),
            mediaUrl: getRandomImage()
            /* eslint-enable max-len */
        };
        

        // Send the message!
        client.messages.create(options, function(err, response) {
            if (err) {
                // Just log it for now
                console.error(err);
            } else {
                // Log the last few digits of a phone number
                let masked = formData.phone.substr(0,formData.phone.length - 5);
                masked += '*****';
                console.log(`Message sent to ${masked}`);
            }
    });
}

initializeFirebase();
app.listen(port);

app.post('/messager', function(request, response) {
    const meetingTime = request.body.meetingTime;
    const meetingLength = request.body.meetingLength;
    const phone = request.body.phone;
    const form = {phone, meetingTime, meetingLength};

    setUpTimeouts(form)
    response.status(200).send('Sending messages!');
});


