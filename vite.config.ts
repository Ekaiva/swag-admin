import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Dev-only middleware that serves the Vercel serverless functions in /api so
// `npm run dev` works the same as production. In production Vercel handles /api.
function vercelApiDevServer(): Plugin {
  return {
    name: 'vercel-api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();

        const route = url.split('?')[0].replace(/^\/api\//, '');
        try {
          // Read and parse the JSON body.
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const raw = Buffer.concat(chunks).toString('utf-8');
          const body = raw ? JSON.parse(raw) : {};

          // Load the handler fresh through Vite's SSR pipeline (TS + ESM).
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          const handler = mod.default;
          if (typeof handler !== 'function') return next();

          // Minimal VercelResponse-compatible adapter over Node's res.
          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(data: unknown) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return vercelRes;
            },
            send(data: unknown) {
              res.end(typeof data === 'string' ? data : JSON.stringify(data));
              return vercelRes;
            },
          });

          await handler(Object.assign(req, { body }), vercelRes);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }),
          );
        }
      });
    },
  };
}

// Minimal Vite config — React + TS. The /api folder is served by the dev plugin
// locally and by Vercel in production.
export default defineConfig({
  plugins: [react(), vercelApiDevServer()],
});
