const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const job_required_specialties = sequelize.define('job_required_specialties', {

   specialty_name: { type: DataTypes.STRING }
});

module.exports = job_required_specialties;

