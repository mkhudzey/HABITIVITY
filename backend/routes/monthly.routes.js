const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.post('/monthly-habits', async (req, res) => {
    const { userId, name, quantity } = req.body;

    if (!userId || !name || !quantity) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
        const result = await pool
        .query(
            `INSERT INTO monthly_habits (userid, habit_name, quantity, done)
            VALUES ($1, $2, $3, false) RETURNING *`,
            [userId, name, quantity]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: 'Error al creal el monthly habit'});
    }
});

router.get('/monthly-habits/:userId', async (req, res) => {
    const userId = req.params.userId;

    try{
        const result = await pool
        .query(
            `SELECT id, userid, habit_name, quantity, done, created_at::text as created_at FROM monthly_habits WHERE userid = $1`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({error: 'Error al obtener los monthly habits'})
    }
});

router.patch('/monthly-habits/:id', async(req, res) => {
    const habitId = req.params.id;
    const {habit_name, quantity} = req.body;
    
    try{
        await pool
        .query(
            `UPDATE monthly_habits SET habit_name = $1, quantity = $2 WHERE id = $3`,
            [habit_name, quantity, habitId]
        );
        
        res.json({message: 'Monthly habit modificado'});

    } catch (error) {
        res.status(500).json({ error: 'Error al modificar el monthly habit'});
    }
});

router.delete('/monthly-habits/:id', async (req, res) => {
    const habitId = req.params.id;

    try{
        await pool
        .query(
            `DELETE FROM monthly_habits WHERE id = $1`,
            [habitId]
        );

        res.json({ message: 'Monthly habit eliminado'});

    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el monthly habit'});
    }
});


//MONTHLY LOGS

router.post('/monthly-logs', async (req, res) => {
    const {habitId, userId, completedDate} = req.body;

    if (!habitId || !userId || !completedDate){
        return res.status(400).json({ error: 'Faltan datos'});
    }

    try {
        const result = await pool
        .query(
            `INSERT INTO monthly_logs (habit_id, user_id, completed_date)
            VALUES ($1, $2, $3) RETURNING *`,
            [habitId, userId, completedDate]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el monthlu log'});
    }
});

router.delete('/monthly-logs/', async (req, res) => {
    const { habitId, userId, completedDate } = req.body;

    if (!habitId || !userId || !completedDate) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
        await pool
        .query(
            `DELETE FROM monthly_logs
            WHERE habit_id = $1 AND user_id = $2 AND completed_date = $3`,
            [habitId, userId, completedDate]
        );

        res.json({ message: 'Monthly log eliminado'});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el monthly log'});
    }
});

router.get('/monthly-logs/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const result = await pool
        .query(
            `SELECT * FROM monthly_logs WHERE user_id = $1`,
            [userId]
        );

        res.json(result.rows);

    } catch ( error ) {
        res.status(500).json({ error: 'Error al obtener los monthly logs '});
    }
});

router.get('/monthly-logs/history/:userId', async (req, res) => {
    const  userId  = req.params.userId;

    const getLast6Months = () => {
        const months = [];
        const now = new Date();

        const c = now.toISOString().slice(0, 7);
        months.unshift(c);
        for(let i = 0; i < 5; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthRes = d.toISOString().slice(0, 7);
            months.unshift(monthRes);
        }

        return months;
    }

    try{
        const months = getLast6Months();

        const logs = await pool
        .query(`SELECT habit_id, completed_date AS month
                FROM monthly_logs
                WHERE user_id = $1`,
                [userId]);

        const logRes = logs.rows.filter(row => months.includes(row.month));
        res.json(logRes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial mensual'});

    }
});

module.exports = router;