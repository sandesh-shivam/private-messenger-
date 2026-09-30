module.exports = {
  apps: [
    {
      name: 'private-messenger',
      script: './index.js',
      cwd: './server',
      instances: 1, // Single instance required for in-memory socket signaling and local store
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
