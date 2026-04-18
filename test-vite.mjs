import { build } from 'vite';
build({
  configFile: false,
  root: '.',
  define: {
    'process.env.TEST': undefined
  }
}).catch(console.error);
