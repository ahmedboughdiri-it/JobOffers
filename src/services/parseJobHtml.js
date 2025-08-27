const cheerio = require('cheerio');
const Rawjobdata = require('../models/Rawjobdata');
const Joboffer = require('../models/Joboffer');
const Company = require('../models/Company');
const job_required_skills = require('../models/job_required_skills');
const job_required_specialties = require('../models/job_required_specialties');
const job_required_domain = require('../models/job_required_domain');

//////////////////////////////
////////parsing for tanitjobs//
////////////////////////////////
async function parseAllJobs() {
  // Fetch all raw jobs
  const rawJobs = await Rawjobdata.findAll();

  // Filter only jobs from TanitJobs
  const tanitJobs = rawJobs.filter(job => job.url?.startsWith("https://www.tanitjobs.com"));

  for (const rawJob of tanitJobs) {
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

      console.log(`✅ Parsed job: ${jobTitle}`);
    } catch (err) {
      console.error(`❌ Error parsing job ID ${rawJob.id}:`, err.message);
    }
  }

  console.log('🚀 All TanitJobs jobs parsed successfully');
}

//////////////////////////////////
///parsing for emploi tunisie////
////////////////////////////////


// Helper function to map experience years to level
function getExperienceLevel(years) {
  if (years === null || years === undefined) return null;

  if (years <= 3) return 'Junior';       // includes 0–3 years
  if (years > 3 && years <= 5) return 'Mid';   // 3–5 years
  if (years > 5 && years <= 8) return 'Senior'; // 5–8 years
  if (years > 8 && years <= 12) return 'Lead';  // 8–12 years
  if (years > 12 && years <= 15) return 'Architect'; // 12–15 years
  return 'Management'; // 15+ years
}




async function parseEmploiTunisieJobs() {
  // Fetch all raw jobs
  const rawJobs = await Rawjobdata.findAll();

  // Filter only jobs from EmploiTunisie
  const emploiJobs = rawJobs.filter(job => job.url?.startsWith("https://www.emploitunisie.com"));

  for (const rawJob of emploiJobs) {
    try {
      const $ = cheerio.load(rawJob.raw_html);

      // --- Extract Job title ---
      const jobTitle = $('.page-title h1').first().text().trim() || 
                       $('.job-title').first().text().replace(/^Poste proposé\s?:\s?/i, '').trim();

      // --- Extract Job description ---
      const jobDescription = $('.job-description').first().text().trim();





// --- Extract city & region ---
let region = $('.arrow-list li:contains("Région") span').first().text().trim();
let city = $('.arrow-list li:contains("Ville") span').first().text().trim();

// Handle Ville if it's remote or empty
if (!city || city.toLowerCase().includes('travail')) {
    city = ''; // ignore remote indicators
}

// Determine address_city
let address_city = city || region || '';
// Normalize long region strings to "Tunis"
if (address_city.includes('-') && address_city.split('-').length > 3) {
    address_city = 'Tunis';
}

// Always use the full region string as address_city_label
let address_city_label = region;

// Set default country label and code for Tunisia
let address_country_label = 'Tunisie';
let address_country_code = 'TN';

// Override country if city indicates foreign location
const foreignCities = {
    'Paris': { label: 'France', code: 'FR' },
    'France': { label: 'France', code: 'FR' }
};

if (city && foreignCities[city]) {
    address_country_label = foreignCities[city].label;
    address_country_code = foreignCities[city].code;
}

console.log({
    address_city,
    address_city_label,
    address_country_label,
    address_country_code
});




      // --- Extract experience ---
      const expText = $('.arrow-list li:contains("Niveau d\'expérience") span').first().text().trim();
      let [job_min_experience_years, job_max_experience_years] = [null, null];
      if (expText) {
        const matches = expText.match(/\d+/g);
        if (matches) {
          job_min_experience_years = parseInt(matches[0]);
          job_max_experience_years = parseInt(matches[1] || matches[0]);
        }
      }

      // Map experience years to experience level
const job_experience_level = getExperienceLevel(job_min_experience_years || job_max_experience_years);



      // --- Extract diploma ---
const diplomaText = $('section:has(h3:contains("Profil recherché")) .job-qualifications ul li strong')
                     .first()
                     .text()
                     .trim();


                           // Select the <li> that contains Bac+
const bacLi = $('li.withicon.graduation-cap span').text().trim();

// Extract the number after Bac+
let job_required_post_bac_years = null;
const match = bacLi.match(/Bac\+(\d+)/i);
if (match) {
    job_required_post_bac_years = parseInt(match[1], 10);
}

console.log(job_required_post_bac_years); // Should print 3


      // --- Extract work type ---
      const workType = $('.arrow-list li:contains("Type de contrat") span').first().text().trim();

      // --- Extract salary ---
const salaryText = $('.arrow-list li:contains("Salaire proposé") span').first().text().trim();
let salary_min = null, salary_max = null, salary_currency = null;

if (salaryText) {
    // Remove non-digit characters except for the range separator "-"
    const nums = salaryText.match(/[\d\s]+/g); 
    if (nums) {
        // Remove spaces inside numbers and convert to integers
        salary_min = parseInt(nums[0].replace(/\s/g, ''), 10);
        salary_max = parseInt((nums[1] || nums[0]).replace(/\s/g, ''), 10);
    }
    // Set currency if present
    salary_currency = 'TND';
}

console.log({ salary_min, salary_max, salary_currency });


      // --- Extract Company ---
      const companyName = $('.card-block-company h3 a').first().text().trim();
      let company = await Company.findOne({ where: { company_name: companyName } });
      if (!company) {
        const website = $('.card-block-company a[rel="nofollow"]').first().attr('href') || null;
        company = await Company.create({ company_name: companyName, website });
      }

      // --- Create Joboffer ---
      const job = await Joboffer.create({
        job_title: jobTitle,
        job_description: jobDescription,
        address_city,
        address_country_code,
        address_country_label,
        job_min_experience_years,
        job_max_experience_years,
         job_experience_level,
        job_required_diploma: diplomaText,
        job_required_post_bac_years,
        work_type_table: workType,
        salary_min,
        salary_max,
        salary_currency,
        company_id: company.id
      });

      // --- Extract skills ---
      const skillTags = $('.skills li').map((i, el) => $(el).text().trim()).get();
      for (const skillName of skillTags) {
        let skill = await job_required_skills.findOne({ where: { skill_name: skillName } });
        if (!skill) {
          skill = await job_required_skills.create({ skill_name: skillName, required_level: 1, skill_type_code: 'TECH' });
        }
        await job.addJob_required_skills(skill);
      }

      console.log(`✅ Parsed EmploiTunisie job: ${jobTitle}`);
    } catch (err) {
      console.error(`❌ Error parsing EmploiTunisie job ID ${rawJob.id}:`, err.message);
    }
  }

  console.log('🚀 All EmploiTunisie jobs parsed successfully');
}


///////////////////////////////////////////
////parsing for keejob////////////////////
/////////////////////////////////////////



module.exports = { parseAllJobs,parseEmploiTunisieJobs };
