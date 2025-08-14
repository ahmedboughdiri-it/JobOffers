const express = require('express');
const sequelize = require('./config/db');

// Import models so Sequelize knows them
require('./models/Company');
require('./models/job_required_specialties');
require('./models/Joboffer');
require('./models/job_required_domain');
require('./models/job_required_skills');
require('./models/Rawjobdata');



const app = express();
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Job Scraper API running...');
});

// Sync DB and start server
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database connected and synced'))
  .catch(err => console.error('❌ DB Error:', err));

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
