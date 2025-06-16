const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');

const User = {

    create: async (username, email, password, role = 'user') => {
        const hashedPassword = await bcrypt.hash(password, 10); 

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, role]
        );

        return result.rows[0];
    },

    findByEmail: async (email) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    },

    findByUsername: async (username) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    },

    existsByEmailOrUsername: async (email, username) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        return result.rows.length > 0;
    },
    
    deleteById: async(userId) => {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1', [userId]
        );
        return result;
    }
};

module.exports = User;
