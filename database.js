require('dotenv').config();
const mysql = require('mysql');
const connection = mysql.createPool({
    connectionLimit: 100,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    socketPath: `/cloudsql/${process.env.SOCKET_NAME}`,
});

module.exports.connection = connection;