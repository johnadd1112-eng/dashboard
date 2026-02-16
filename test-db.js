require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString ? connectionString.split('@')[1] : 'UNDEFINED');

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false, // For testing
    },
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.message);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.message);
        }
        console.log('Database Connected Successfully:', result.rows[0]);
        pool.end();
    });
});
