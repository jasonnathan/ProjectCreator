const fs = require('fs').promises;
const { exec } = require('child_process');
const {
  generateMinimalNginxConfig,
  generateNodeNginxTemplate,
  generatePhpNginxTemplate,
  appendConfigInclude,
  restartNginx,
  requestSSLCertificate,
  generateNginxConfig,
} = require('./nginxConfig');

jest.mock('fs').promises;
jest.mock('child_process');

describe('generateMinimalNginxConfig', () => {
  it('should generate the minimal nginx configuration', async () => {
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
    expect(config.trim()).toBe(expectedConfig.trim());
  });
});

describe('generateNodeNginxTemplate', () => {
  it('should generate the Node.js Nginx template', async () => {
    const template = await generateNodeNginxTemplate();
    expect(template).toContain('proxy_pass http://localhost:3000;');
  });
});

describe('generatePhpNginxTemplate', () => {
  it('should generate the PHP Nginx template', async () => {
    const template = await generatePhpNginxTemplate();
    expect(template).toContain('fastcgi_pass unix:/run/php/php8.1-fpm.sock;');
  });
});

describe('appendConfigInclude', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('existing config');
    jest.spyOn(fs, 'appendFile').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should append the config include to nginx.conf', async () => {
    const configInclude = 'include /path/to/project/config/nginx.conf;';
    await appendConfigInclude(configInclude);
    expect(fs.readFile).toHaveBeenCalledWith('/etc/nginx/nginx.conf', 'utf8');
    expect(fs.appendFile).toHaveBeenCalledWith('/etc/nginx/nginx.conf', `\n${configInclude}\n`);
  });

  it('should not append the config include if it already exists in nginx.conf', async () => {
    const configInclude = 'include /path/to/project/config/nginx.conf;';
    fs.readFile.mockResolvedValue('existing config include');
    await appendConfigInclude(configInclude);
    expect(fs.readFile).toHaveBeenCalledWith('/etc/nginx/nginx.conf', 'utf8');
    expect(fs.appendFile).not.toHaveBeenCalled();
  });
});

describe('restartNginx', () => {
  beforeEach(() => {
    exec.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should restart Nginx', async () => {
    await restartNginx();
    expect(exec).toHaveBeenCalledWith('sudo service nginx restart');
  });
});

describe('requestSSLCertificate', () => {
  beforeEach(() => {
    exec.mockResolvedValue({});
    exec.mockClear();
  });

  it('should request SSL certificate using Certbot', async () => {
    const domain = 'example.com';
    const projectPath = '/path/to/project';
    const email = 'test@example.com';
    const sslCertPath = `${projectPath}/config/cert.pem`;
    const sslKeyPath = `${projectPath}/config/key.pem`;

    await requestSSLCertificate({ domain, projectPath, email, sslCertPath, sslKeyPath });

    const expectedCertbotCommand = `sudo certbot certonly --webroot -w ${projectPath}/public_html -d ${domain} --non-interactive --agree-tos --email ${email} --cert-path ${sslCertPath} --key-path ${sslKeyPath}`;
    expect(exec).toHaveBeenCalledWith(expectedCertbotCommand);
  });
});

describe('generateNginxConfig', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
    jest.spyOn(fs, 'mkdir').mockResolvedValue();
    jest.spyOn(fs, 'readFile').mockResolvedValue('');
    jest.spyOn(fs, 'appendFile').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate the nginx configuration with correct cert and key paths', async () => {
    const domain = 'example.com';
    const language = 'nodejs';
    const projectPath = '/path/to/project';
    const email = 'test@example.com';

    await generateNginxConfig({ domain, language, projectPath, email });

    // Assert that the correct cert and key paths are used in the requestSSLCertificate function
    const sslCertPath = `${projectPath}/config/cert.pem`;
    const sslKeyPath = `${projectPath}/config/key.pem`;
    expect(requestSSLCertificate).toHaveBeenCalledWith({ domain, projectPath, email, sslCertPath, sslKeyPath });

    // Assert that the fullNginxConfig is generated and written to the config file
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledWith(`${projectPath}/config/nginx.conf`, expect.any(String));
    expect(fs.writeFile).toHaveBeenCalledWith(`${projectPath}/config/nginx.conf`, expect.any(String));
  });
});