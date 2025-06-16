const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);


router.get('/weekly-habits/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const result = await pool.query(
        `SELECT id, userid, habit_name, quantity, done, created_at::text as created_at FROM weekly_habits WHERE userid = $1`,
        [userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No hay hábitos semanales' });
      }
  
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener hábitos semanales', details: error.message });
    }
});

router.post('/weekly-habits', async (req, res) => {
    try {
      const { userId, name, quantity , created_at } = req.body;
  
      if (!userId || !name) {
        return res.status(400).json({ error: "El userId y el nombre del hábito son requeridos" });
      }
  
      const result = await pool.query(
        `INSERT INTO weekly_habits (userid, habit_name, quantity, done, created_at)
         VALUES ($1, $2, $3, false, $4) RETURNING *`,
        [userId, name, quantity, created_at]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear hábito semanal', details: error.message });
    }
});


router.patch('/updateDone/:habitId', async (req, res) => {
    try {
      const habitId = req.params.habitId;
      const { done } = req.body;
  
      const result = await pool.query(
        `UPDATE weekly_habits SET done = $1 WHERE id = $2 RETURNING *`,
        [done, habitId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Hábito no encontrado' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar estado', details: error.message });
    }
});

router.patch('/updateHabit/weekly/:habitId', async (req, res) => {
    const habitId = req.params.habitId;
    const { habit_name, quantity } = req.body;
  
    try {
      const result = await pool.query(
        `UPDATE weekly_habits
         SET habit_name = $2, quantity = $3
         WHERE id = $1
         RETURNING *`,
        [habitId, habit_name, quantity]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Hábito no encontrado' });
      }
  
      res.json({ message: 'Hábito actualizado', habit: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'No se pudo modificar el hábito', details: error.message });
    }
});

router.delete('/weekly-habits/:habitId', async (req, res) => {
    try {
      const habitId = req.params.habitId;
  
      const result = await pool.query(
        `DELETE FROM weekly_habits WHERE id = $1 RETURNING *`,
        [habitId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Hábito no encontrado' });
      }
  
      res.json({ message: 'Hábito eliminado', habit: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar hábito', details: error.message });
    }
});
  


//WEEKLY LOGS

router.get('/weekly-logs/:userId', async (req, res) => {
    const userId = req.params.userId;
  
    try {
      const result = await pool
      .query(
        `SELECT habit_id,
               date_trunc('week', completed_date)::date::text AS week,
               bool_or(true) AS done
        FROM weekly_logs
        WHERE user_id = $1
          AND completed_date >= CURRENT_DATE - INTERVAL '28 days'
        GROUP BY habit_id, week
        ORDER BY week DESC`,
        [userId]
    );
  
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener logs semanales', details: error.message });
    }
});


router.post('/weekly-logs', async (req, res) => {
    try {
      const { habitId, userId, completedDate } = req.body;
  
      if (!habitId || !userId || !completedDate) {
        return res.status(400).json({ error: 'habitId, userId y completedDate son requeridos' });
      }
  
      const result = await pool
      .query(
        `INSERT INTO weekly_logs (habit_id, user_id, completed_date)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [habitId, userId, completedDate]
      );
  
      res.status(201).json({ message: 'Log semanal registrado', log: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Error al insertar log', details: error.message });
    }
});

router.delete('/weekly-logs', async (req, res) => {
    try {
      const { habitId, userId, completedDate } = req.body;
  
      if (!habitId || !userId || !completedDate) {
        return res.status(400).json({ error: 'habitId, userId y completedDate son requeridos' });
      }
  
      const result = await pool
      .query(
        `DELETE FROM weekly_logs
         WHERE habit_id = $1 AND user_id = $2 AND completed_date = $3
         RETURNING *`,
        [habitId, userId, completedDate]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Log no encontrado' });
      }
  
      res.status(200).json({ message: 'Log eliminado', log: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar log', details: error.message });
    }
});

router.get('/weekly-logs/completed-count/:userId', async (req, res) => {
  const userId = req.params.userId;

  try{
    const result = await pool
    .query(
       `
      WITH weeks AS (
        SELECT to_char(generate_series(
          DATE_TRUNC('week', CURRENT_DATE) - interval '7 weeks',
          DATE_TRUNC('week', CURRENT_DATE),
          interval '1 week'
        ), 'YYYY-MM-DD') AS week
      )
      SELECT 
        w.week,
        COALESCE(COUNT(l.*), 0) AS completed_count
      FROM weeks w
      LEFT JOIN weekly_logs l 
        ON to_char(DATE_TRUNC('week', l.completed_date), 'YYYY-MM-DD') = w.week
        AND l.user_id = $1
      GROUP BY w.week
      ORDER BY w.week
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({error: 'Error al obtener weekly logs'});
  }
});


module.exports = router;