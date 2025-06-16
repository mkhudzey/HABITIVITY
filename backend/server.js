const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const habitLogRoutes = require('./routes/habitlog.routes');
const weeklyRoutes = require('./routes/weekly.routes');
const monthlyRoutes = require('./routes/monthly.routes');
const statsRoutes = require('./routes/stats.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/logs', habitLogRoutes);
app.use('/api/weekly', weeklyRoutes);
app.use('/api/monthly', monthlyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => {
    console.log('Servidor en ejecución en http://localhost:3000');
});
