const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const job_required_domain = sequelize.define('job_required_domain', {
  
  domain_name: { type: DataTypes.STRING, allowNull: false }
});


module.exports = job_required_domain;
