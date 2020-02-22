const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require("body-parser");
const app = express();
const dotenv = require('dotenv').config();
const port = process.env.PORT || 8080;
const { listenForNotifications } = require('./services/notifications');

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(helmet())

var Admin = require('./routes/Admin');

app.use('/admin', Admin);

app.listen(port, function () {
    console.log("Server is running on port: " + port);
});

listenForNotifications()