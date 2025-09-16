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

const { scrapeJobsFromUrl,getJobById ,scrapeJobsFromEmploiTunisie,scrapeJobsFromKeejobs} = require("./controllers/jobController");
const { parseAllJobs,parseEmploiTunisieJobs,parseKeejobJobs} = require("./services/parseJobHtml");

const app = express();

const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Job Scraper API",
    version: "1.0.0",
    description: "API for scraping and parsing job offers"
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "/": {
      get: {
        summary: "Health check",
        responses: { 200: { description: "API running" } }
      }
    },
    "/scrapeEmploiTn": {
  post: {
    summary: "Scrape job offers from EmploiTunisie",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              url: { type: "string", example: "https://emploi.tn/jobs" }
            },
            required: ["url"]
          }
        }
      }
    },
    responses: { 200: { description: "Jobs scraped successfully" } }
  }
},
"/scrapekeejob": {
  post: {
    summary: "Scrape job offers from Keejob",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              url: { type: "string", example: "https://keejob.com/jobs" }
            },
            required: ["url"]
          }
        }
      }
    },
    responses: { 200: { description: "Jobs scraped successfully" } }
  }
},
"/scrape": {
  post: {
    summary: "Scrape job offers from a given URL",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              url: { type: "string", example: "https://example.com/jobs" }
            },
            required: ["url"]
          }
        }
      }
    },
    responses: { 200: { description: "Jobs scraped successfully" } }
  }
},
    "/job/{id}": {
      get: {
        summary: "Get a job by ID",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } }
        ],
        responses: { 200: { description: "Job details" }, 404: { description: "Job not found" } }
      }
    },
    "/parse-jobs": {
      post: {
        summary: "Parse jobs from tanitjobs",
        responses: { 200: { description: "All jobs parsed successfully" } }
      }
    },
    "/parse-emploitunisie": {
      post: {
        summary: "Parse EmploiTunisie jobs",
        responses: { 200: { description: "All jobs parsed successfully" } }
      }
    },
    "/parse-keejob": {
      post: {
        summary: "Parse Keejob jobs",
        responses: { 200: { description: "All jobs parsed successfully" } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
//app.use(express.urlencoded({ extended: true })); // parses URL-encoded bodies

// //////////////Test route
app.get('/', (req, res) => {
  res.send('Job Scraper API running...');
});
// //////////Route for scraping/////////
app.post("/scrapeEmploiTn",scrapeJobsFromEmploiTunisie);

app.post("/scrapekeejob",scrapeJobsFromKeejobs);

app.post("/scrape", scrapeJobsFromUrl);


app.get('/job/:id', getJobById); 



/////////parsing////////
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

app.post('/parse-keejob',async(req,res)=> {
  try{
    await parseKeejobJobs();
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
