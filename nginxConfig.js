// nginxConfig.js

const fs = require('fs').promises;
const { exec } = require('child_process');

// Function to generate the minimal Nginx configuration
async function generateMinimalNginxConfig(domain, projectPath) {
  return `
    server {
      listen 80;
      server_name ${domain};

      location / {
        try_files $uri $uri/ =404;
      }

      location /.well-known/acme-challenge {
        root ${projectPath}/public_html;
        try_files $uri =404;
      }
    }
  `;
}

// Function to append the configuration include to nginx.conf
async function appendConfigInclude(configInclude) {
  try {
    const nginxConfPath = '/etc/nginx/nginx.conf';
    const nginxConf = await fs.readFile(nginxConfPath, 'utf8');
    if (!nginxConf.includes(configInclude)) {
      await fs.appendFile(nginxConfPath, `\n${configInclude}\n`);
    }
  } catch (error) {
    console.error('Error appending config include to nginx.conf:', error.message);
  }
}

// Function to restart Nginx
async function restartNginx() {
  try {
    await exec('sudo service nginx restart');
  } catch (error) {
    console.error('Error restarting Nginx:', error.message);
  }
}

// Function to request SSL certificate using certbot
async function requestSSLCertificate({domain, projectPath, email, sslCertPath, sslKeyPath}) {
  try {
    const certbotCommand = `sudo certbot certonly --webroot -w ${projectPath}/public_html -d ${domain} --non-interactive --agree-tos --email ${email} --cert-path ${sslCertPath} --key-path ${sslKeyPath}`;
    await exec(certbotCommand);
  } catch (error) {
    console.error('Error requesting SSL certificate with Certbot:', error.message);
  }
}

// Function to generate the full Nginx configuration with SSL
async function generateFullNginxConfig(minimalConfig, template) {
  return `${minimalConfig}\n${template}`;
}

// Function to generate the Nginx configuration
async function generateNginxConfig({ domain, language, projectPath, email }) {
  try {
    const minimalNginxConfig = await generateMinimalNginxConfig(domain, projectPath);
    await fs.mkdir(`${projectPath}/config`, { recursive: true });
    await fs.writeFile(`${projectPath}/config/nginx.conf`, minimalNginxConfig);

    const configInclude = `include ${projectPath}/config/nginx.conf;`;
    await appendConfigInclude(configInclude);
    await restartNginx();

    const sslCertPath = `${projectPath}/config/cert.pem`;
    const sslKeyPath = `${projectPath}/config/key.pem`;
    await requestSSLCertificate(domain, projectPath, email, sslCertPath, sslKeyPath);

    const languageTemplate = language === 'nodejs' ? await generateNodeNginxTemplate() : await generatePhpNginxTemplate();

    const fullNginxConfig = await generateFullNginxConfig(minimalNginxConfig, languageTemplate);

    await fs.writeFile(`${projectPath}/config/nginx.conf`, fullNginxConfig);

    await restartNginx();
    console.log('Nginx restarted with SSL certificates.');
  } catch (error) {
    console.error('Error generating nginx configuration:', error.message);
  }
}

// Function to generate the Node.js specific Nginx configuration template
async function generateNodeNginxTemplate() {
  return `
    location / {
      proxy_pass http://localhost:3000;
    }
  `;
}

// Function to generate the PHP specific Nginx configuration template
async function generatePhpNginxTemplate() {
  return `
    location ~ \\.php$ {
      fastcgi_pass unix:/run/php/php8.1-fpm.sock;
      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
      include fastcgi_params;
    }
  `;
}


module.exports = {
  generateMinimalNginxConfig,
  generateNodeNginxTemplate,
  generatePhpNginxTemplate,
  appendConfigInclude,
  restartNginx,
  requestSSLCertificate,
  generateNginxConfig,
  generateFullNginxConfig
};