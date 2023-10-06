// datetimeUtils.js

const { DateTime } = require('luxon');

function convertToWAT(date) {
  const watDateTime = DateTime.fromJSDate(date, { zone: 'Africa/Lagos' }); // 'Africa/Lagos' represents WAT
  return watDateTime.toFormat('yyyy-MM-dd HH:mm:ss');
}

module.exports = {
  convertToWAT,
};
