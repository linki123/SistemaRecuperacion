const mysql = require("mysql2/promise");

const db = mysql.createPool({

    host:
        process.env.MYSQLHOST || "localhost",

    user:
        process.env.MYSQLUSER || "root",

    password:
        process.env.MYSQLPASSWORD || "7301226517593",

    database:
        process.env.MYSQLDATABASE || "sistema_recuperacion",

    port:
        process.env.MYSQLPORT || 3306,

    waitForConnections:
        true,

    connectionLimit:
        10,

    queueLimit:
        0

});

module.exports = db;