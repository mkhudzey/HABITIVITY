const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

router.use(verifyToken);
router.use(verifyAdmin);

router.get('/stats', async (req, res) => {
    try {
      
      const usersRes = await pool.query('SELECT COUNT(*) FROM users');
      const totalUsers = Number(usersRes.rows[0].count);
  
      
      const dailyRes = await pool.query('SELECT COUNT(*) FROM daily_habits');
      const weeklyRes = await pool.query('SELECT COUNT(*) FROM weekly_habits');
      const monthlyRes = await pool.query('SELECT COUNT(*) FROM monthly_habits');
  
      const totalHabits = {
        daily: Number(dailyRes.rows[0].count),
        weekly: Number(weeklyRes.rows[0].count),
        monthly: Number(monthlyRes.rows[0].count)
      };
    
      const avgDailyPerUser = (totalHabits.daily / totalUsers).toFixed(2);
      const avgWeeklyPerUser = (totalHabits.weekly / totalUsers).toFixed(2);
      const avgMonthlyPerUser = (totalHabits.monthly / totalUsers).toFixed(2);


      res.json({
        totalUsers,
        totalHabits,
        avgDailyPerUser,
        avgWeeklyPerUser,
        avgMonthlyPerUser
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/users', async (req, res) => {

  try{
    const result = await pool.query(
      `SELECT id, username, email, role FROM users ORDER BY id ASC`
    );

    res.status(200).json(result.rows);

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios'});
  }
});
  
module.exports = router;