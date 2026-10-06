// Builds the example site with its photo: serves fixtures/ on 127.0.0.1:4599 while
// `astro build` runs, so the CI exercises the same remote-photo path as production
// (download, optimisation, srcset, structured data). Used by `npm run build:fixtures`.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import sirv from 'sirv';

const server = createServer(sirv('fixtures', { dev: true })).listen(4599, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));

const build = spawn('npx', ['astro', 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { CONTACT_FORM: 'netlify', ...process.env, FIXTURE_PHOTO_SERVER: '1', RESUME_STRICT_PHOTO: '1' },
});
const code = await new Promise((resolve) => build.once('exit', resolve));
server.close();
process.exit(code ?? 1);
