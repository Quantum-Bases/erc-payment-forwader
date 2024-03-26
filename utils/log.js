const chalk = require('chalk');

module.exports = (log, color = 'yellow') => console.log(chalk[color](log));
