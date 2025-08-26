require('dotenv').config({path: '../.env'}); 
const express = require('express');
const sequelize = require('./config/db');
const bodyParser = require("body-parser");



// Import models so Sequelize knows them
require('./models/Company');
require('./models/job_required_specialties');
require('./models/Joboffer');
require('./models/job_required_domain');
require('./models/job_required_skills');
require('./models/Rawjobdata');

const { scrapeJobsFromUrl,getJobById ,scrapeJobsFromEmploiTunisie} = require("./controllers/jobController");
const { parseAllJobs,parseEmploiTunisieJobs} = require("./services/parseJobHtml");

const app = express();
app.use(express.json());
//app.use(express.urlencoded({ extended: true })); // parses URL-encoded bodies

// Test route
app.get('/', (req, res) => {
  res.send('Job Scraper API running...');
});
// Route for scraping
app.post("/scrape", scrapeJobsFromUrl);

app.post("/scrapeEmploiTn",scrapeJobsFromEmploiTunisie);

app.get('/job/:id', getJobById); 

app.post('/parse-jobs', async (req, res) => {
  try {
    await parseAllJobs();
    res.json({ message: 'All jobs parsed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/parse-emploitunisie',async(req,res)=> {
  try{
    await parseEmploiTunisieJobs();
    res.json({message:'all jobs parsed successfully'});
  }catch(err){
    res.status(500).json({message:err.message});
  }
});


// Sync DB and start server
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database connected and synced'))
  .catch(err => console.error('❌ DB Error:', err));

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
