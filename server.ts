/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Serve static files from public folder
  const publicPath = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // API endpoint: Overwrites src/config/defaultConfig.ts directly with the new config
  app.post('/api/save-config', async (req, res) => {
    try {
      const newConfig = req.body;
      if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid config payload' });
      }

      const filePath = path.resolve(process.cwd(), 'src/config/defaultConfig.ts');

      const fileContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StageConfig } from '../types/game';

export const DEFAULT_STAGE_CONFIG: StageConfig = ${JSON.stringify(newConfig, null, 2)};
`;

      await fs.promises.writeFile(filePath, fileContent, 'utf-8');
      console.log('Successfully saved configuration directly to', filePath);

      return res.json({
        success: true,
        message: 'Saved configuration directly to src/config/defaultConfig.ts',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error saving config:', errorMsg);
      return res.status(500).json({ error: errorMsg });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
