const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/completed-logs/:userId', async (req, res) => {
    const userId = req.params.userId;

    try{
        const dailyRes = await pool
        .query(
            `SELECT TO_CHAR(completed_date::date, 'YYYY-MM') AS month, COUNT(*) AS total
            FROM daily_logs
            WHERE user_id = $1
            GROUP BY month
            ORDER BY month`,
            [userId]
        );

        const weeklyRes = await pool
        .query(
            `SELECT TO_CHAR(completed_date::date, 'YYYY-MM') AS month, COUNT(*) AS total
            FROM weekly_logs
            WHERE user_id = $1
            GROUP BY month
            ORDER BY month`,
            [userId]
        );

        const monthlyRes = await pool
        .query(
            `SELECT TO_CHAR((completed_date || '-01')::date, 'YYYY-MM') AS month, COUNT(*) AS total
                FROM monthly_logs
                WHERE user_id = $1
                GROUP BY month
                ORDER BY month`,
            [userId]
        );

        const monthSet = new Set();
        dailyRes.rows.forEach(row => monthSet.add(row.month));
        weeklyRes.rows.forEach(row => monthSet.add(row.month));
        monthlyRes.rows.forEach(row => monthSet.add(row.month));

        const sortedMonths = Array.from(monthSet).sort();

        const toMap = (rows) => {
            const map = {}
            rows.forEach(row => map[row.month] = parseInt(row.total));
            return map;
        }

        const dailyMap = toMap(dailyRes.rows);
        const weeklyMap = toMap(weeklyRes.rows);
        const monthlyMap = toMap(monthlyRes.rows);

        const response = {
            labels: sortedMonths,
            daily: sortedMonths.map(m => dailyMap[m] || 0),
            weekly: sortedMonths.map(m => weeklyMap[m] || 0),
            monthly: sortedMonths.map(m => monthlyMap[m] || 0)
        };

        res.json(response);

    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Error al obtener las estadisticas'});
    }
});


module.exports = router;