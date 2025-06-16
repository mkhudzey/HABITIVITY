const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

async function processDailyHabits() {
    const today = new Date().toISOString().split('T')[0];

    try {
        const result = await pool
        .query(
            'SELECT * FROM daily_habits WHERE done= true'
        );

        for (const habit of result.rows) {
            await pool
            .query(
                'INSERT INTO daily_logs (habit_id, user_id, completed_date) VALUES ($1, $2, $3)',
                [habit.id, habit.userid, today]
            );
        }

        await pool
        .query(
            'UPDATE daily_habits SET done = false'
        );

    } catch (error) {
        console.error('Error al insertar los habitos',error );
    }
    
}

router.get('/daily-logs/:userId', async (req, res) => {
    const userId = req.params.userId;

    const range = parseInt(req.query.range) || 30;

    try{
        const result = await pool
        .query(
            `SELECT habit_id, completed_date::date::text FROM daily_logs WHERE user_id = $1 AND completed_date >= CURRENT_DATE - INTERVAL '${range} days'`,
            [userId]
        );

        res.json(result.rows);
    } catch(error) {
        res.status(500).json({ error: 'Error al obtener los registros diarios'});
    }
});

router.post('/daily-logs', async (req, res) => {
    try{
        const { habitId, userId, completedDate} = req.body;

        if (!habitId || !userId || !completedDate) {
            return res.status(400).json({ error: 'habitId, userId y completedDate son requeridos' });
        }

        const result = await pool
        .query(
            'INSERT INTO daily_logs (habit_id, user_id, completed_date) VALUES ($1, $2, $3) RETURNING *',
            [habitId, userId, completedDate]
        );
        res.status(201).json({ message: 'log Insertado'});

    } catch (error) {
        res.status(500).json({error: 'Error al insertar'});
    }
});

router.delete('/daily-logs', async (req, res) => {
    try{
        const {habitId, userId, completedDate} = req.body;

        if (!habitId || !userId || !completedDate) {
            return res.status(400).json({ error: 'habitId, userId y completedDate son requeridos' });
        }

        const result = await pool
        .query(
            'DELETE FROM daily_logs WHERE habit_id=$1 AND user_id=$2 AND completed_date=$3 RETURNING *',
            [habitId, userId, completedDate]
        );
        res.status(201).json({message: 'log eliminado'});


    } catch (error) {
        res.status(500).json({ message: 'Error al borrar el log'});
    }
});


module.exports = router;
