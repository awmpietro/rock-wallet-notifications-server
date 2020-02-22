const express = require('express');
const admin = express.Router();
const database = require('../database');
const cors = require('cors')
//const moment = require('moment');
const dotenv = require('dotenv').config();
const { addAddressToQueue } = require('../services/notifications');
admin.use(cors());

admin.post('/token', function(req, res, next){
    
    const {token, address} = req.body

    database.connection.getConnection(function (err, connection) {
        if (err) {
            res.status(500).json({"database_connection_error:" : err.message});
        } else {
            connection.query('INSERT INTO user SET token = ?, address = ?', [token, address], function (err, rows, fields) {
                if (err) {
                    res.status(204).json({"query_error" : err.message});
                } else {
                    addAddressToQueue(address)
                    res.status(201).json({"success" : "Token saved Succesfully"})
                }
            });
            connection.release();
        }
    });
});

module.exports = admin;