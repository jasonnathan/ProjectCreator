const { exec } = require('child_process');
const readline = require('readline');

function checkSudo() {
  if (process.getuid && process.getuid() !== 0) {
    console.error('This script needs to be run as root (sudo).');
    process.exit(1);
  }
}

function promptConfirmation(packages) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`The following packages will be installed: ${packages.join(', ')}\nDo you want to continue? (y/n): `, (answer) => {
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Installation aborted.');
      process.exit(0);
    } else {
      installPackages(packages);
    }
  });
}

function installPackages(packages) {
  const command = `apt-get install -y ${packages.join(' ')}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error occurred during package installation:', error.message);
    } else {
      console.log('Packages installed successfully.');
    }
  });
}

module.exports = {
  checkSudo,
  promptConfirmation
};
