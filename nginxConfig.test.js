const {
  generateMinimalNginxConfig,
  appendConfigInclude,
  restartNginx,
  requestSSLCertificate,
  generateFullNginxConfig,
  generateNodeNginxTemplate,
  generatePhpNginxTemplate,
} = require('./nginxConfig');
const { exec } = require('child_process');

jest.mock('child_process');
 describe('Nginx Configuration', () => {
  describe('generateMinimalNginxConfig', () => {
    test('should generate minimal Nginx configuration with domain and project path', async () => {
      const domain = 'example.com';
      const projectPath = '/path/to/project';
       const expectedConfig = `
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
       const config = await generateMinimalNginxConfig(domain, projectPath);
      expect(config).toEqual(expectedConfig);
    });
  });
   describe('appendConfigInclude', () => {
    test('should append config include to nginx.conf', async () => {
      const configInclude = 'include /path/to/config/nginx.conf;';
       // Mocking the fs module
      const fs = require('fs').promises;
      fs.readFile = jest.fn().mockResolvedValue('existing nginx.conf content');
      fs.appendFile = jest.fn();
       await appendConfigInclude(configInclude);
       expect(fs.readFile).toHaveBeenCalledWith('/etc/nginx/nginx.conf', 'utf8');
      expect(fs.appendFile).toHaveBeenCalledWith('/etc/nginx/nginx.conf', '\n' + configInclude + '\n');
    });
  });
   describe('restartNginx', () => {
    test('should restart Nginx service', async () => {
      // Mocking the child_process module
      const { exec } = require('child_process');
      exec.mockImplementation((command, callback) => {
        callback(null, 'Nginx restarted');
      });
       await restartNginx();
       expect(exec).toHaveBeenCalledWith('sudo service nginx restart');
    });
  });
   describe('requestSSLCertificate', () => {
    test('should request SSL certificate using Certbot', async () => {
      const domain = 'example.com';
      const projectPath = '/path/to/project';
      const email = 'test@example.com';
      const sslCertPath = '/path/to/cert.pem';
      const sslKeyPath = '/path/to/key.pem';
       // Mocking the child_process module
      const { exec } = require('child_process');
      exec.mockImplementation((command, callback) => {
        callback(null, 'SSL certificate requested');
      });
       await requestSSLCertificate({ domain, projectPath, email, sslCertPath, sslKeyPath });
       const expectedCommand = `sudo certbot certonly --webroot -w ${projectPath}/public_html -d ${domain} --non-interactive --agree-tos --email ${email} --cert-path ${sslCertPath} --key-path ${sslKeyPath}`;
      expect(exec).toHaveBeenCalledWith(expectedCommand);
    });
  });
   describe('generateFullNginxConfig', () => {
    test('should generate full Nginx configuration by combining minimal config and template', async () => {
      const minimalConfig = 'minimal Nginx config';
      const template = 'Nginx template';
       const expectedConfig = `${minimalConfig}\n${template}`;
       const config = await generateFullNginxConfig(minimalConfig, template);
      expect(config).toEqual(expectedConfig);
    });
  });
   describe('generateNodeNginxTemplate', () => {
    test('should generate Node.js specific Nginx configuration template', async () => {
      const expectedTemplate = `
    location / {
      proxy_pass http://localhost:3000;
    }
  `;
       const template = await generateNodeNginxTemplate();
      expect(template).toEqual(expectedTemplate);
    });
  });
   describe('generatePhpNginxTemplate', () => {
    test('should generate PHP specific Nginx configuration template', async () => {
      const expectedTemplate = `
    location ~ \\.php$ {
      fastcgi_pass unix:/run/php/php8.1-fpm.sock;
      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
      include fastcgi_params;
    }
  `;
       const template = await generatePhpNginxTemplate();
      expect(template).toEqual(expectedTemplate);
    });
  });
});