const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Job Scraper API',
    description: 'API for scraping and parsing job offers',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js']; // file(s) with your routes

swaggerAutogen(outputFile, endpointsFiles, doc);
