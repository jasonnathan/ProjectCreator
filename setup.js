const readline = require('readline');
const { execSync } = require('child_process');
const { generateDBAptPackages, generateLanguageAptPackages } = require('./packageGenerator');

// Function to check if the script is run with sudo
function checkRoot() {
  if (process.geteuid() !== 0) {
    console.error('This script needs to be run as root (sudo).');
    process.exit(1);
  }
}

// Function to prompt the user and get their choice of language
function promptUserForLanguage() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Choose a language (nodejs/php): ', (language) => {
      rl.close();
      resolve(language.toLowerCase());
    });
  });
}

// Function to prompt the user and get their choice of database
function promptUserForDatabase() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Choose a database (mysql/mongodb/sqlite): ', (database) => {
      rl.close();
      resolve(database.toLowerCase());
    });
  });
}

// Function to execute apt installer commands
function executeAptInstaller(commands) {
  commands.forEach((command) => {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
  });
}

async function setup() {
  checkRoot();

  try {
    const language = await promptUserForLanguage();
    const database = await promptUserForDatabase();

    // Install language-specific packages
    const languagePackages = generateLanguageAptPackages(language);
    executeAptInstaller(languagePackages);

    // Install database-specific packages
    const databasePackages = generateDBAptPackages(database);
    executeAptInstaller(databasePackages);

    // Your code to create directories, configure Nginx, and set permissions goes here...

  } catch (err) {
    console.error('Error occurred:', err.message);
  }
}

// Run the setup function
setup();
