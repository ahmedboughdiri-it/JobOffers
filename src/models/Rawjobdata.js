const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Rawjobdata = sequelize.define('Rawjobdata', {
  
  raw_html: { type: DataTypes.TEXT, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false }
});



module.exports = Rawjobdata;
