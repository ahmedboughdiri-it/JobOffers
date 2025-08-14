  const { DataTypes } = require('sequelize');
  const sequelize = require('../config/db');
  const Company =require('./Company');
  const job_required_specialties= require('./job_required_specialties');
  const job_required_skills = require ('./job_required_skills');
const job_required_domain = require('./job_required_domain');

  const Joboffer = sequelize.define('Joboffer', {
    address_city: { type: DataTypes.STRING },
    address_country_code: { type: DataTypes.STRING },
    address_country_label: { type: DataTypes.STRING },
    //job_title: { type: DataTypes.STRING },
    job_description: { type: DataTypes.STRING },
    job_posting_date: { 
        type: DataTypes.DATE,       // date field
        allowNull: false,           // cannot be null
        defaultValue: DataTypes.NOW // default to current timestamp
    },
    job_expiry_date: { 
        type: DataTypes.DATE,       // date field
        allowNull: false,           // cannot be null
        defaultValue: DataTypes.NOW // default to current timestamp
    },
    job_experience_level: { type: DataTypes.INTEGER },
    job_min_experience_years: { type: DataTypes.INTEGER },
    job_max_experience_years: { type: DataTypes.INTEGER },
    job_required_diploma: { type: DataTypes.INTEGER },
    job_required_post_bac_years: { type: DataTypes.INTEGER },
    job_status: {type: DataTypes.STRING},
    job_title: {type: DataTypes.STRING},
    salary_currency: {type: DataTypes.STRING},
    salary_min: { type: DataTypes.INTEGER },
    salary_max: { type: DataTypes.INTEGER },
    work_type_code: {type: DataTypes.STRING},
    work_type_table: {type: DataTypes.STRING}
  });

  // Many-to-one: many joboffers belong to one company
  Joboffer.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

 // Many-to-many: a job offer can have many specialities, and a specialities can belong to many job offers
Joboffer.belongsToMany(job_required_specialties, {
  through: 'JobofferSpecialty',  // junction table
  foreignKey: 'joboffer_id', // column in junction table referring to Joboffer
  otherKey: 'specialty_id',      // column in junction table referring to Skill
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

job_required_specialties.belongsToMany(Joboffer, {
  through: 'JobofferSpecialty',
  foreignKey: 'specialty_id',    // column in junction table referring to Skill
  otherKey: 'joboffer_id',   // column in junction table referring to Joboffer
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
 



 // Many-to-many: a job offer can have many skills, and a skill can belong to many job offers
Joboffer.belongsToMany(job_required_skills, {
  through: 'JobofferSkill',  // junction table
  foreignKey: 'joboffer_id', // column in junction table referring to Joboffer
  otherKey: 'skill_id',      // column in junction table referring to Skill
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

job_required_skills.belongsToMany(Joboffer, {
  through: 'JobofferSkill',
  foreignKey: 'skill_id',    // column in junction table referring to Skill
  otherKey: 'joboffer_id',   // column in junction table referring to Joboffer
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
 



 // Many-to-many: a job offer can have many domains, and a domain can belong to many joboffers
Joboffer.belongsToMany(job_required_domain, {
  through: 'JobofferDomain',  // junction table
  foreignKey: 'joboffer_id', // column in junction table referring to Joboffer
  otherKey: 'domain_id',      // column in junction table referring to Skill
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

job_required_domain.belongsToMany(Joboffer, {
  through: 'JobofferDomain',
  foreignKey: 'domain_id',    // column in junction table referring to Skill
  otherKey: 'joboffer_id',   // column in junction table referring to Joboffer
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});





  module.exports = Joboffer;
