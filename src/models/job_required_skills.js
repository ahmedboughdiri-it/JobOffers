const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const job_required_skills = sequelize.define('job_required_skills', { 
  required_level: { type: DataTypes.INTEGER, allowNull: false },
  skill_name: { type: DataTypes.STRING, allowNull: false },
  skill_type_code: { type: DataTypes.ENUM('TECH', 'SOFT'), allowNull: false }
});


module.exports = job_required_skills;
