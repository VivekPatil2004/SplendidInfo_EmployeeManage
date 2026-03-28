module.exports = {
  apps: [
    {
      name: 'mern-employee-api',
      script: './dist/index.js',
      instances: 'max',   // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for PM2 load balancing
      watch: false,
      max_memory_restart: '1G', // Restart if memory exceeds 1 GB
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true
    }
  ]
};
