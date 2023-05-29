require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'bot',
      script: 'yarn',
      args: 'run workspace bot start',
      // exp_backoff_restart_delay: 1000,
      restart_delay: 5000,
      autorestart: true,
      env: {
        ...process.env,
        ...parseEnv('.env')
      }
    },
    {
      name: 'frontend',
      script: 'yarn',
      args: 'run workspace frontend start',
      env: {
        ...process.env,
        ...parseEnv('.env')
      }
    }
  ]
};

function parseEnv(filePath) {
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');

  const envPath = path.resolve(process.cwd(), filePath);
  const env = dotenv.parse(fs.readFileSync(envPath));

  return env;
}
