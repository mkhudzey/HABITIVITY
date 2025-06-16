const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    database: "web",
    password: "postgres",
});

pool.on('error', (err) => {
    console.error('Error en la conexión a la base de datos:', err.message);
});

module.exports = pool;
