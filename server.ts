import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter, authMiddleware } from './server/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Attach auth middleware to all requests
  app.use(authMiddleware as any);

  // Mount API router
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', platform: 'CampusBite Canteen System', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware mounted');
  } else {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`🚀 Serving static production build from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🍽️  CAMPUSBITE CANTEEN PLATFORM RUNNING ON PORT ${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting CampusBite server:', err);
  process.exit(1);
});
