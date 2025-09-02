const cheerio = require('cheerio');

const Rawjobdata = require('../models/Rawjobdata');
const Joboffer = require('../models/Joboffer');
const Company = require('../models/Company');
const job_required_skills = require('../models/job_required_skills');
const job_required_specialties = require('../models/job_required_specialties');
const job_required_domain = require('../models/job_required_domain');


// --- Domains and specialties for software engineering ---
const domainKeywords = [
    "Software Development", "Web Development", "Mobile Development", "Frontend Development", "Backend Development",
    "Full-Stack Development", "Data Science", "Machine Learning", "Artificial Intelligence", "Deep Learning",
    "Cloud Computing", "DevOps", "Cybersecurity", "Database Administration", "Embedded Systems", "Networking",
    "Game Development", "UI/UX Design", "Quality Assurance", "Big Data", "Business Intelligence", "Data Engineering",
    "System Administration", "IT Support", "IoT Development", "Blockchain Development", "Software Architecture",
    "API Development", "Platform Engineering", "Site Reliability Engineering"
];

const specialtyKeywords = [
    "Full-Stack Development", "Frontend Development", "Backend Development",
    "React Development", "Angular Development", "Vue Development", "Node.js Development",
    "Python Development", "Java Development", "C# Development", "JavaScript Development",
    "Mobile App Development", "iOS Development", "Android Development", "DevOps Engineering",
    "Data Engineering", "Machine Learning Engineering", "AI Engineering",
    "Cybersecurity Specialist", "Database Administration", "QA Automation", "Cloud Engineer",
    "Big Data Engineer", "System Architect", "SRE", "Platform Engineer", "Software Architect"
];


// --- Extract domains from title, description, and skills ---
function extractDomains(text, skills = []) {
    const foundDomains = new Set();
    const lowerText = text.toLowerCase();

    // Check in text using domainKeywords (assume it's defined elsewhere)
    for (const domain of domainKeywords) {
        if (lowerText.includes(domain.toLowerCase())) foundDomains.add(domain);
    }

    // Infer domains from skills (normalize skills to lowercase)
    for (const skillRaw of skills) {
        const skill = skillRaw.toLowerCase();

        // Software Development
        if (["react","angular","vue","nuxt","next.js","node.js","python","java","c#","c++","php","ruby","go","swift","kotlin","dart"].includes(skill)) {
            foundDomains.add("Software Development");
        }
        // Frontend Web
        if (["html","css","javascript","typescript","react","angular","vue","svelte","bootstrap","tailwind css","material ui"].includes(skill)) {
            foundDomains.add("Frontend Development");
        }
        // Backend / API
        if (["node.js","python","java","php","c#","django","flask","spring boot","laravel","symfony","ruby on rails","asp.net","nestjs","koa","fastapi"].includes(skill)) {
            foundDomains.add("Backend Development");
        }
        // Database
        if (["mysql","mariadb","postgresql","mongodb","redis","sqlite","oracle","sql server","cassandra","neo4j"].includes(skill)) {
            foundDomains.add("Database Administration");
        }
        // Cloud & DevOps
        if (["aws","azure","gcp","google cloud","docker","kubernetes","terraform","ansible","jenkins","gitlab ci","circleci","travis ci","ci/cd","helm","prometheus","grafana","nginx"].includes(skill)) {
            foundDomains.add("Cloud Computing");
        }
        // Data / ML / AI
        if (["tensorflow","pytorch","scikit-learn","keras","pandas","numpy","matplotlib","seaborn","xgboost","lightgbm"].includes(skill)) {
            foundDomains.add("Machine Learning");
            foundDomains.add("Data Science");
        }
        // System / Networking
        if (["linux","bash","shell","networking","tcp/ip"].includes(skill)) {
            foundDomains.add("System Administration");
        }
        // Mobile Development
        if (["react native","flutter","swift","kotlin","android","ios","xamarin"].includes(skill)) {
            foundDomains.add("Mobile Development");
        }
        // QA / Testing
        if (["selenium","cypress","jest","mocha","pytest","junit","rspec"].includes(skill)) {
            foundDomains.add("Quality Assurance");
        }
        // Big Data
        if (["hadoop","spark","kafka","hive","pig","airflow","nifi","sqoop","presto","flink"].includes(skill)) {
            foundDomains.add("Big Data");
            foundDomains.add("Data Engineering");
        }
        // Cybersecurity
        if (["penetration testing","firewall","vpn","ids","ips","wireshark","metasploit"].includes(skill)) {
            foundDomains.add("Cybersecurity");
        }
        // Web / API
        if (["rest","restful","graphql","soap","grpc","websockets","json","xml","oauth","jwt"].includes(skill)) {
            foundDomains.add("API Development");
        }
    }

    return Array.from(foundDomains);
}

// --- Extract specialties from title, description, and skills ---
function extractSpecialties(text, skills = []) {
    const foundSpecs = new Set();
    const lowerText = text.toLowerCase();

    for (const spec of specialtyKeywords) {
        if (lowerText.includes(spec.toLowerCase())) foundSpecs.add(spec);
    }

    // Normalize skills
    const normSkills = skills.map(s => s.toLowerCase());

    const frontendSkills = ["react","angular","vue","nuxt","next.js","svelte","bootstrap","tailwind css","material ui","html","css","javascript","typescript"];
    const backendSkills = ["node.js","python","java","php","c#","django","flask","spring boot","laravel","symfony","ruby on rails","asp.net","nestjs","koa","fastapi"];
    const mobileSkills = ["react native","flutter","swift","kotlin","android","ios","xamarin"];
    const devopsSkills = ["docker","kubernetes","terraform","ansible","jenkins","gitlab ci","circleci","travis ci","ci/cd","helm"];
    const dataSkills = ["tensorflow","pytorch","scikit-learn","keras","pandas","numpy","matplotlib","seaborn","xgboost","lightgbm"];

    if (normSkills.some(s => frontendSkills.includes(s))) foundSpecs.add("Frontend Development");
    if (normSkills.some(s => backendSkills.includes(s))) foundSpecs.add("Backend Development");
    if (normSkills.some(s => frontendSkills.includes(s)) && normSkills.some(s => backendSkills.includes(s))) foundSpecs.add("Full-Stack Development");
    if (normSkills.some(s => mobileSkills.includes(s))) foundSpecs.add("Mobile Development");
    if (normSkills.some(s => devopsSkills.includes(s))) foundSpecs.add("DevOps Engineering");
    if (normSkills.some(s => dataSkills.includes(s))) foundSpecs.add("Data Science / ML Engineering");

    // Optional: detect specialty from title too
    if (lowerText.includes("full stack")) foundSpecs.add("Full-Stack Development");
    if (lowerText.includes("frontend")) foundSpecs.add("Frontend Development");
    if (lowerText.includes("backend")) foundSpecs.add("Backend Development");
    if (lowerText.includes("mobile")) foundSpecs.add("Mobile Development");
    if (lowerText.includes("data engineer") || lowerText.includes("machine learning")) foundSpecs.add("Data Science / ML Engineering");
    if (lowerText.includes("devops")) foundSpecs.add("DevOps Engineering");

    return Array.from(foundSpecs);
}







//////////////////////////////
/// parsing for tanitjobs ////
//////////////////////////////

// Helper function to map experience years to level
function getExperienceLevel(years) {
  if (years === null || years === undefined) return null;

  if (years <= 3) return 'Junior';             // 0–3 years
  if (years > 3 && years <= 5) return 'Mid';   // 3–5 years
  if (years > 5 && years <= 8) return 'Senior';// 5–8 years
  if (years > 8 && years <= 12) return 'Lead'; // 8–12 years
  if (years > 12 && years <= 15) return 'Architect'; // 12–15 years
  return 'Management'; // 15+ years
}

async function parseAllJobs() {
  const rawJobs = await Rawjobdata.findAll();
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
      let address_city = '', address_country_label = '', address_country_code = null;
      if (locationText) {
        const parts = locationText.split(',').map(p => p.trim());
        address_city = parts[0] || '';
        address_country_label = parts[1] || '';
      }
      if (address_country_label && address_country_label.toLowerCase() === 'tunisie') {
        address_country_code = 'TN';
      }

      // --- Extract experience ---
      const expText = $("dt:contains('Experience')").next('dd').text().trim();
      let [job_min_experience_years, job_max_experience_years] = [null, null];
      if (expText) {
        const nums = expText.match(/\d+/g);
        if (nums && nums.length > 0) {
          job_min_experience_years = parseInt(nums[0], 10);
          job_max_experience_years = parseInt(nums[1] || nums[0], 10);
        }
      }
      const job_experience_level = getExperienceLevel(job_min_experience_years || job_max_experience_years);

      // --- Extract diploma ---
const diplomaText = $('h3:contains("Niveau d\'études") + p').first().text().trim();

// --- Extract post-bac years ---
let job_required_post_bac_years = null;
const bacMatch = diplomaText.match(/Bac\s*\+(\d+)/i); // look anywhere in the string
if (bacMatch) {
  job_required_post_bac_years = parseInt(bacMatch[1], 10);
}


      // --- Extract work type ---
      const workType = $("dt:contains(\"Type d'emploi\")").next('dd').text().trim();

      // --- Extract salary ---
      const salaryText = $("dt:contains('Rémunération')").next('dd').text().trim();
      let salary_min = null, salary_max = null, salary_currency = null;
      if (salaryText && !salaryText.toLowerCase().includes('confidentiel')) {
        const nums = salaryText.match(/\d+/g);
        if (nums) {
          salary_min = parseInt(nums[0], 10);
          salary_max = parseInt(nums[1] || nums[0], 10);
        }
        salary_currency = 'TND';
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
        address_country_code,
        job_min_experience_years,
        job_max_experience_years,
        job_experience_level,
        job_required_diploma: diplomaText,
        job_required_post_bac_years,
        work_type_table: workType,
        salary_min,
        salary_max,
        salary_currency,
        job_expiry_date,
        company_id: company.id
      });

      // --- Extract skills from tags OR description ---
let skillTags = $('.bootstrap-tagsinput .tag').map((i, el) => $(el).text().trim()).get();

// Fallback: if no tags found, extract from description
if (skillTags.length === 0) {
    skillTags = extractSkillsFromDescription(jobDescription);
}

// Add skills to DB
for (const skillName of skillTags) {
    let skill = await job_required_skills.findOne({ where: { skill_name: skillName } });
    if (!skill) {
        skill = await job_required_skills.create({ skill_name: skillName, required_level: 1, skill_type_code: 'TECH' });
    }
    await job.addJob_required_skills(skill);
}



// --- Extract domains & specialties ---
const jobDomains = extractDomains(jobTitle + " " + jobDescription, skillTags);
for (const domainName of jobDomains) {
    let domain = await job_required_domain.findOne({ where: { domain_name: domainName } });
    if (!domain) {
        domain = await job_required_domain.create({ domain_name: domainName });
    }
    await job.addJob_required_domains(domain);
}

const jobSpecialties = extractSpecialties(jobTitle + " " + jobDescription, skillTags);
for (const specialtyName of jobSpecialties) {
    let specialty = await job_required_specialties.findOne({ where: { specialty_name: specialtyName } });
    if (!specialty) {
        specialty = await job_required_specialties.create({ specialty_name: specialtyName });
    }
    await job.addJob_required_specialties(specialty);
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


// --- Extract domains & specialties ---
const jobDomains = extractDomains(jobTitle + " " + jobDescription, skillTags);
for (const domainName of jobDomains) {
    let domain = await job_required_domain.findOne({ where: { domain_name: domainName } });
    if (!domain) {
        domain = await job_required_domain.create({ domain_name: domainName });
    }
    await job.addJob_required_domains(domain);
}

const jobSpecialties = extractSpecialties(jobTitle + " " + jobDescription, skillTags);
for (const specialtyName of jobSpecialties) {
    let specialty = await job_required_specialties.findOne({ where: { specialty_name: specialtyName } });
    if (!specialty) {
        specialty = await job_required_specialties.create({ specialty_name: specialtyName });
    }
    await job.addJob_required_specialties(specialty);
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

//////////////////////////////
/// parsing for Keejob ///////
//////////////////////////////


// Helper function to map experience years to level
function getExperienceLevel(years) {
  if (years === null || years === undefined) return null;
  if (years <= 3) return 'Junior';
  if (years > 3 && years <= 5) return 'Mid';
  if (years > 5 && years <= 8) return 'Senior';
  if (years > 8 && years <= 12) return 'Lead';
  if (years > 12 && years <= 15) return 'Architect';
  return 'Management';
}

// --- Skills extractor for software engineering ---
const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Scala', 'Perl', 'R', 'Rust', 'Dart', 'Elixir',
    'React', 'Angular', 'Vue', 'Nuxt', 'Next.js', 'Svelte', 'Ember', 'Backbone', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material UI',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Symfony', 'Ruby on Rails', 'ASP.NET', 'Gin', 'NestJS', 'Koa', 'FastAPI',
    'MySQL', 'MariaDB', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra', 'Neo4j', 'Elasticsearch',
    'REST', 'RESTful', 'GraphQL', 'SOAP', 'gRPC', 'WebSockets', 'JSON', 'XML',
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'CircleCI', 'Travis CI', 'CI/CD', 'Helm', 'Prometheus', 'Grafana', 'Nginx',
    'Unit Testing', 'Integration Testing', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Chai', 'PyTest', 'JUnit', 'RSpec', 'Karma', 'Enzyme',
    'React Native', 'Flutter', 'Xamarin', 'SwiftUI', 'Kotlin Multiplatform', 'Android', 'iOS',
    'Hadoop', 'Spark', 'Kafka', 'Hive', 'Pig', 'Airflow', 'NiFi', 'Sqoop', 'Presto', 'Flink',
    'TensorFlow', 'PyTorch', 'scikit-learn', 'Keras', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'OpenCV', 'XGBoost', 'LightGBM',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
    'Linux', 'Bash', 'Shell', 'REST API', 'JSON', 'OAuth', 'JWT', 'Firebase', 'ElasticSearch', 'RabbitMQ', 'ActiveMQ', 'MQTT', 'SOAP', 'Postman', 'Swagger', 'OpenAPI'
];

function extractSkillsFromDescription(description) {
    if (!description) return [];
    const foundSkills = new Set();
    const lowerDesc = description.toLowerCase();

    for (const skill of skillKeywords) {
        // Case-insensitive match
        const regex = new RegExp(`\\b${skill.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerDesc)) {
            foundSkills.add(skill);
        }
    }
    return Array.from(foundSkills);
}


async function parseKeejobJobs() {
  const rawJobs = await Rawjobdata.findAll();
  const keejobJobs = rawJobs.filter(job => job.url?.startsWith("https://www.keejob.com"));

  for (const rawJob of keejobJobs) {
    try {
      const $ = cheerio.load(rawJob.raw_html);

      // --- Job Title ---
      const jobTitle = $('h1.text-2xl').first().text().trim();

      // --- Job Description ---
      const jobDescription = $('.prose').first().text().trim();

      // --- Extract Company ---
      const companyName = $('h3:contains("Entreprise") + div h3').first().text().trim() || 'Unknown';
      let company = await Company.findOne({ where: { company_name: companyName } });
      if (!company) {
        company = await Company.create({ company_name: companyName });
      }

      // --- Extract location ---
      const locationText = $('h3:contains("Lieu de travail") + p').first().text().trim();
      let address_city = '', address_country_label = '', address_country_code = null;
      if (locationText) {
        const parts = locationText.split(',').map(p => p.trim());
        address_city = parts[1] || parts[0];
        address_country_label = parts[2] || 'Tunisie';
      }
      if (address_country_label.toLowerCase() === 'tunisie') address_country_code = 'TN';

      // --- Extract experience ---
      const expText = $('h3:contains("Expérience requise") + p').first().text().trim();
      let [job_min_experience_years, job_max_experience_years] = [null, null];
      if (expText) {
        const matches = expText.match(/\d+/g);
        if (matches) {
          job_min_experience_years = parseInt(matches[0], 10);
          job_max_experience_years = parseInt(matches[1] || matches[0], 10);
        }
      }
      const job_experience_level = getExperienceLevel(job_min_experience_years || job_max_experience_years);

      // --- Extract diploma ---
const diplomaText = $('h3:contains("Niveau d\'études") + p').first().text().trim();

// --- Extract post-Bac years ---
let job_required_post_bac_years = null;
if (diplomaText) {
    const bacMatch = diplomaText.match(/Bac\s*\+\s*(\d+)/i); // looks for Bac + number
    if (bacMatch) {
        job_required_post_bac_years = parseInt(bacMatch[1], 10); // put the number in the field
    }
}


      // --- Extract work type from Disponibilité ---
const disponibiliteText = $('h3:contains("Disponibilité") + p').first().text().trim();

let work_type_table = null;
let work_type_code = null;

// Map availability to code
const workTypeMap = {
    'Plein temps': { table: 'Full Time', code: 'FT' },
    'Temps partiel': { table: 'Part Time', code: 'PT' },
    'Hybrid': { table: 'Hybrid', code: 'HBD' },
    'Télétravail': { table: 'Remote', code: 'REM' },
    'Freelance': { table: 'Freelance', code: 'FRE' },
    'CDD': { table: 'Fixed-term', code: 'CDD' },
    'SIVP': { table: 'SIVP', code: 'SIVP' },
    'Intérim': { table: 'Temporary', code: 'TMP' },
    'Saisonnier': { table: 'Seasonal', code: 'SEA' }
};

if (disponibiliteText && workTypeMap[disponibiliteText]) {
    work_type_table = workTypeMap[disponibiliteText].table;
    work_type_code = workTypeMap[disponibiliteText].code;
}

// --- Extract salary ---
const salaryText = $('h3:contains("Salaire proposé") + div span').first().text().trim();
let salary_min = null, salary_max = null, salary_currency = null;
if (salaryText) {
    const nums = salaryText.match(/\d+/g);
    if (nums) {
        salary_min = parseInt(nums[0], 10);
        salary_max = parseInt(nums[1] || nums[0], 10);
        salary_currency = 'TND';
    }
}

// --- Create Joboffer ---
const job = await Joboffer.create({
    job_title: jobTitle,
    job_description: jobDescription,
    address_city,
    address_country_label,
    address_country_code,
    job_min_experience_years,
    job_max_experience_years,
    job_experience_level,
    job_required_diploma: diplomaText,
    job_required_post_bac_years,
    work_type_table,  // <-- use mapped value
    work_type_code,   // <-- new column for code
    salary_min,
    salary_max,
    salary_currency,
    company_id: company.id
});


     // --- Extract skills from description ---
const skillTags = extractSkillsFromDescription(jobDescription);
for (const skillName of skillTags) {
    let skill = await job_required_skills.findOne({ where: { skill_name: skillName } });
    if (!skill) {
        skill = await job_required_skills.create({ skill_name: skillName, required_level: 1, skill_type_code: 'TECH' });
    }
    await job.addJob_required_skills(skill);
}



// --- Extract domains & specialties ---
const jobDomains = extractDomains(jobTitle + " " + jobDescription, skillTags);
for (const domainName of jobDomains) {
    let domain = await job_required_domain.findOne({ where: { domain_name: domainName } });
    if (!domain) {
        domain = await job_required_domain.create({ domain_name: domainName });
    }
    await job.addJob_required_domains(domain);
}

const jobSpecialties = extractSpecialties(jobTitle + " " + jobDescription, skillTags);
for (const specialtyName of jobSpecialties) {
    let specialty = await job_required_specialties.findOne({ where: { specialty_name: specialtyName } });
    if (!specialty) {
        specialty = await job_required_specialties.create({ specialty_name: specialtyName });
    }
    await job.addJob_required_specialties(specialty);
}


      console.log(`✅ Parsed Keejob job: ${jobTitle}`);
    } catch (err) {
      console.error(`❌ Error parsing Keejob job ID ${rawJob.id}:`, err.message);
    }
  }

  console.log('🚀 All Keejob jobs parsed successfully');
}


module.exports = { parseAllJobs,parseEmploiTunisieJobs ,parseKeejobJobs};
