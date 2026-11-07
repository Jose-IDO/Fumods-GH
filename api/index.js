// Vercel runs HTTP requests without starting the standalone Socket.io server.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const app = require('../server/dist/app').default;

export default (req, res) => {
  req.url = req.url.replace(/^\/api(?=\/|\?|$)/, '') || '/';
  return app(req, res);
};
