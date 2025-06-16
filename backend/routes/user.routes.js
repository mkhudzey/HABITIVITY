const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);


router.get('/profile/:userId', verifyToken, async (req, res) => {
    try {

        const userId = req.params.userId;
        const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [userId]);
        
        const user = userResult.rows[0];

        const daily = await pool.query('SELECT * FROM daily_habits WHERE userid = $1', [userId]);
        const weekly = await pool.query('SELECT * FROM weekly_habits WHERE userid = $1', [userId]);
        const monthly = await pool.query('SELECT * FROM monthly_habits WHERE userid = $1', [userId]);


        res.json({
        ...user,
        dailyHabits: daily.rows,
        weeklyHabits: weekly.rows,
        monthlyHabits: monthly.rows
        });


    } catch (error) {
      res.status(500).json({ error: 'Error obteniendo perfil', details: error.message });
    }
  });


router.get('/daily-habits/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const today = new Date().toISOString().split('T')[0];

        const lastResetRes = await pool.query(
            "SELECT TO_CHAR(last_habit_reset, 'YYYY-MM-DD') AS last_habit_reset FROM users WHERE id = $1",
            [userId]
        );

        const lastReset = lastResetRes.rows[0]?.last_habit_reset;

        if(!lastReset || lastReset < today) {
            
            await pool
            .query(
                'UPDATE daily_habits SET done = false WHERE userid = $1',
                [userId]
            );
            
            await pool.query(
            'UPDATE users SET last_habit_reset = $1 WHERE id = $2',
            [today, userId]
          );
        }

        

        const result = await pool
        .query(
            'SELECT id, userid, habit_name, quantity, creation_date::text as creation_date, done FROM daily_habits WHERE userid = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No hay habitos' });
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos', details: error.message });
    }
});

router.patch('/updateDone/daily/:habitId', async (req, res) => {
    try {
        const habitId = req.params.habitId;
        const { done } = req.body;

        const result = await pool
        .query('UPDATE daily_habits SET done = $1 WHERE id = $2 RETURNING *',[done, habitId]);

        if (result.rowCount == 0 ){
            return res.status(404).json({ error: 'Habito no encontrado'});
        }

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el estado'});
    }

});

router.patch('/updateHabit/daily/:habitId', async (req, res) => {
    const dailyId = req.params.habitId;
    const {habit_name, quantity} = req.body;

    try {
        const result = await pool
        .query(
            'UPDATE daily_habits SET habit_name = $2, quantity = $3 WHERE id = $1 RETURNING *',
            [dailyId, habit_name, quantity]
        );
        
        if(result.rowCount == 0) {
            return res.status(404).json({ error: 'habito no encontrado'});
        }

        res.json({ message: 'Habito actualizado', habit: result.rows[0]});

    } catch (error) {
        res.status(500).json({ error: 'No se pudo modificar el habito'});
    }
});

router.post('/daily-habits', async (req, res) => {
    try {
        const { userId, name, quantity} = req.body;
        
        if (!userId || !name) {
            return res.status(400).json({ error: "El userId y el nombre del hábito son requeridos" });
        }
        

        const result = await pool
        .query(
            'INSERT INTO daily_habits (userid, habit_name, quantity, done) VALUES ($1, $2, $3, false) RETURNING *',
            [userId, name, quantity]
        );

        res.status(201).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error agregando habito', error});
    }    
});

router.delete('/daily-habits/:dailyId', async (req, res) => {

    try{
        const dailyId = req.params.dailyId;

        const result = await pool
        .query(
            'DELETE FROM daily_habits WHERE id = $1 RETURNING *',
            [dailyId]
        );

        if (result.rowCount == 0){
            return res.status(404).json({ error: 'Habito no encontrado'});
        }

        res.json({ message: 'Habito eliminado', habit: result});

    } catch (error){
        res.status(500).json({ error: 'Error eliminando habito'});
    }
});

router.post('/change-password', async (req, res) => {
    const {userId, currentPassword, newPassword} = req.body;

    if(!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Datos incompletos'});
    }

    try {
        const result = await pool
        .query('SELECT password FROM users WHERE id = $1', [userId]);

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado'});
        }

        const valid = await bcrypt.compare(currentPassword, user.password);

        if(!valid) {
            return res.status(401).json({ error: 'Contraseña incorrecta'});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool
        .query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        res.json({ message: 'Contraseña actualizada'});
    } catch (error) {
        console.error('Error al cambiar la contraseña', error);
        res.status(500).json({ error: 'Error'});
    }
});

router.get('/done-count/:userId', async (req, res) => {
    const{ userId } = req.params;

    try{
        const daily = await pool
        .query('SELECT COUNT(*) FROM daily_logs WHERE user_id = $1', [userId]);

        const weekly = await pool
        .query('SELECT COUNT(*) FROM weekly_logs WHERE user_id = $1', [userId]);

        const monthly = await pool
        .query('SELECT COUNT(*) FROM monthly_logs WHERE user_id = $1', [userId]);

        res.json({
            daily: Number(daily.rows[0].count),
            weekly: Number(weekly.rows[0].count),
            monthly: Number(monthly.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: 'Error sl consultar los habitos completados'});
    }
});
  
  

module.exports = router;
