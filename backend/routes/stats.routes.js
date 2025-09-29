const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

function monthStrToDate(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
function dateToMonthStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
function fillMonthRange(sortedLabels) {
  if (!sortedLabels.length) return [];
  const start = monthStrToDate(sortedLabels[0]);
  const end   = monthStrToDate(sortedLabels[sortedLabels.length - 1]);

  const out = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(dateToMonthStr(cur));
    cur.setMonth(cur.getMonth() + 1, 1);
  }
  return out;
}


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

        const now = new Date();
        const currentMonth = dateToMonthStr(new Date(now.getFullYear(), now.getMonth(), 1));

        const expanded = (sortedMonths.length && sortedMonths[sortedMonths.length - 1] < currentMonth)
        ? [...sortedMonths, currentMonth]
        : sortedMonths;

        const labels = fillMonthRange(expanded);

        const toMap = (rows) => {
            const map = {}
            rows.forEach(row => map[row.month] = parseInt(row.total));
            return map;
        }

        const dailyMap = toMap(dailyRes.rows);
        const weeklyMap = toMap(weeklyRes.rows);
        const monthlyMap = toMap(monthlyRes.rows);

        const response = {
            labels,
            daily: labels.map(m => dailyMap[m] || 0),
            weekly: labels.map(m => weeklyMap[m] || 0),
            monthly: labels.map(m => monthlyMap[m] || 0)
        };

        res.json(response);

    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Error al obtener las estadisticas'});
    }
});


module.exports = router;