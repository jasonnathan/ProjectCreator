// packageGenerator.js

// Function to generate apt packages for a specific database
function generateDBAptPackages(database) {
  switch (database) {
    case 'mysql':
      return ['mysql-server'];
    case 'mongodb':
      return ['mongodb'];
    case 'sqlite':
      return ['sqlite3'];
    default:
      throw new Error(`Unsupported database: ${database}`);
  }
}

// Function to generate apt packages for a specific language
function generateLanguageAptPackages(language) {
  switch (language) {
    case 'nodejs':
      return ['curl', 'nodejs'];
    case 'php':
      return [
        'php8.1', 'php8.1-fpm', 'php8.1-cli', 'php8.1-common',
        'php8.1-mysql', 'php8.1-zip', 'php8.1-gd', 'php8.1-mbstring',
        'php8.1-curl', 'php8.1-xml', 'php8.1-bcmath'
      ];
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

module.exports = {
  generateDBAptPackages,
  generateLanguageAptPackages,
};
