const { scrapeTanitJobs } = require("../services/jobScraperService");
const {scrapeEmploiTunisie} = require("../services/jobScraperService");
const {scrapeKeejob} = require("../services/jobScraperService");
const Joboffer = require("../models/Joboffer");
const Company = require("../models/Company");
const job_required_skills = require("../models/job_required_skills");
const job_required_specialties = require("../models/job_required_specialties");
const job_required_domain = require("../models/job_required_domain");


async function scrapeJobsFromUrl(req, res) {
  try {
    const { url } = req.body; // input from frontend or Postman

    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    await scrapeTanitJobs(url);

    res.json({ message: "Scraping completed successfully" });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Something went wrong while scraping" });
  }
}


async function scrapeJobsFromEmploiTunisie(req,res) {
  try {
    const {url} = req.body;//
    if (!url){
      return res.status(400).json({error: "Missing URL"});
    }
  
  await scrapeEmploiTunisie(url);
  res.json({message:"Scrapping from Emploi Tunisie Completed"});
  }catch (error){
    console.error("scraping error:",error);
    res.status(500).json({error: "Something went wrong while scraping"});
  }
}


async function scrapeJobsFromKeejobs(req,res) {
  try {
    const {url} = req.body;//
    if (!url){
      return res.status(400).json({error: "Missing URL"});
    }
  
  await scrapeKeejob(url);
  res.json({message:"Scrapping from Keejob completed"});
  }catch (error){
    console.error("scraping error:",error);
    res.status(500).json({error: "Something went wrong while scraping"});
  }
}



const getJobById = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Joboffer.findByPk(id, {
      include: [
        { model: Company },
        { model: job_required_skills },
        { model: job_required_specialties },
        { model: job_required_domain }
      ]
    });

    if (!job) {
      return res.status(404).json({ error: 'Job offer not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = { scrapeJobsFromUrl ,getJobById, scrapeJobsFromEmploiTunisie , scrapeJobsFromKeejobs};
