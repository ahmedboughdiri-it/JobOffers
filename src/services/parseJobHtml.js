const cheerio = require('cheerio');
const Rawjobdata = require('../models/Rawjobdata');
const Joboffer = require('../models/Joboffer');
const Company = require('../models/Company');
const job_required_skills = require('../models/job_required_skills');
const job_required_specialties = require('../models/job_required_specialties');
const job_required_domain = require('../models/job_required_domain');

async function parseAllJobs() {
  const rawJobs = await Rawjobdata.findAll();

  for (const rawJob of rawJobs) {
    try {
      const $ = cheerio.load(rawJob.raw_html);

      // --- Extract Company ---
      const companyName = $('.listing-item__info--item-company').first().text().trim();
      let company = await Company.findOne({ where: { company_name: companyName } });
      if (!company) {
        company = await Company.create({ company_name: companyName });
      }

      // --- Extract Job title ---
      const jobTitle = $('.details-header__title').first().text().trim();

      // --- Extract Job description ---
      const jobDescription = $('.details-body__content').first().text().trim();

      // --- Extract city & country ---
      const locationText = $('.listing-item__info--item-location').first().text().trim();
      let address_city = '', address_country_label = '';
      if (locationText) {
        const parts = locationText.split(',').map(p => p.trim());
        address_city = parts[0] || '';
        address_country_label = parts[1] || '';
      }

      // --- Extract experience ---
      const expText = $("dt:contains('Experience')").next('dd').text().trim();
      let [job_min_experience_years, job_max_experience_years] = [null, null];
      if (expText && expText.includes('à')) {
        const nums = expText.match(/\d+/g);
        if (nums) {
          job_min_experience_years = parseInt(nums[0]);
          job_max_experience_years = parseInt(nums[1] || nums[0]);
        }
      }

      // --- Extract diploma ---
      const diplomaText = $("dt:contains('Niveau d'étude')").next('dd').text().trim();

      // --- Extract work type ---
      const workType = $("dt:contains('Type d'emploi')").next('dd').text().trim();

      // --- Extract salary ---
      const salaryText = $("dt:contains('Rémunération')").next('dd').text().trim();
      let salary_min = null, salary_max = null, salary_currency = null;
      if (salaryText && !salaryText.toLowerCase().includes('confidentiel')) {
        const nums = salaryText.match(/\d+/g);
        if (nums) {
          salary_min = parseInt(nums[0]);
          salary_max = parseInt(nums[1] || nums[0]);
        }
        salary_currency = 'TND'; // adjust if site provides currency
      }

      // --- Extract job expiry date ---
      const expiryText = $("h3:contains(\"Date d'expiration\")").next('.details-body__content').text().trim();
      const job_expiry_date = expiryText ? new Date(expiryText) : null;

      // --- Create Joboffer ---
      const job = await Joboffer.create({
        job_title: jobTitle,
        job_description: jobDescription,
        address_city,
        address_country_label,
        job_min_experience_years,
        job_max_experience_years,
        job_required_diploma: diplomaText,
        work_type_table: workType,
        salary_min,
        salary_max,
        salary_currency,
        job_expiry_date,
        company_id: company.id
      });

      // --- Extract skills from tags ---
      const skillTags = $('.bootstrap-tagsinput .tag').map((i, el) => $(el).text().trim()).get();
      for (const skillName of skillTags) {
        let skill = await job_required_skills.findOne({ where: { skill_name: skillName } });
        if (!skill) {
          skill = await job_required_skills.create({ skill_name: skillName, required_level: 1, skill_type_code: 'TECH' });
        }
        await job.addJob_required_skills(skill);
      }

      // --- You can add specialties or domains if you have specific mapping ---
      // For example:
      // await job.addJob_required_specialties(someSpecialty);
      // await job.addJob_required_domain(someDomain);

      console.log(`✅ Parsed job: ${jobTitle}`);
    } catch (err) {
      console.error(`❌ Error parsing job ID ${rawJob.id}:`, err.message);
    }
  }

  console.log('🚀 All jobs parsed successfully');
}

module.exports = { parseAllJobs };
