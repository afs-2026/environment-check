import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'frontend');
const windows = process.platform === 'win32';
const env = { ...process.env };
const reports = path.join(root, '.reports');
mkdirSync(reports, { recursive: true });
const log = path.join(reports, `check-${new Date().toISOString().replaceAll(':', '-')}.log`);
const children = new Set();
let stage = 'checking prerequisites';

function note(message) { console.log(message); appendFileSync(log, `${message}\n`); }
function command(program, args, cwd = root) {
  note(`\n> ${path.basename(program)} ${args.join(' ')}`);
  let result;
  if (windows && program.endsWith('.cmd')) {
    const quoted = [program, ...args].map(value => {
      if (/[\r\n"%]/.test(value)) throw new Error('Unsupported command argument');
      return `"${value}"`;
    }).join(' ');
    result = spawnSync(env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${quoted}"`], { cwd, env, encoding: 'utf8', windowsVerbatimArguments: true });
  } else {
    result = spawnSync(program, args, { cwd, env, encoding: 'utf8' });
  }
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);
  appendFileSync(log, output);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(program)} exited with code ${result.status}`);
  return output;
}

function configureCache() {
  const location = env.ENVIRONMENT_CHECK_CACHE_ROOT;
  if (!location) return;
  const cache = path.resolve(location);
  env.MAVEN_USER_HOME = path.join(cache, 'maven');
  env.npm_config_cache = path.join(cache, 'npm');
  env.PLAYWRIGHT_BROWSERS_PATH = path.join(cache, 'playwright');
  mkdirSync(env.MAVEN_USER_HOME, { recursive: true });
}

function prerequisites() {
  if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Install Node.js 24 LTS and reopen the terminal.');
  if (!env.JAVA_HOME || !existsSync(path.join(env.JAVA_HOME, 'bin', windows ? 'javac.exe' : 'javac'))) {
    throw new Error('Set JAVA_HOME to the installed JDK 21 folder (not its bin folder). Use BellSoft JDK 21 from Software Center.');
  }
  const java = command('java', ['-version']);
  const javac = command('javac', ['-version']);
  const home = command(path.join(env.JAVA_HOME, 'bin', windows ? 'java.exe' : 'java'), ['-version']);
  if (!/version "21[.\"]/.test(java) || !/javac 21(?:[.\s]|$)/.test(javac) || !/version "21[.\"]/.test(home)) {
    throw new Error('java, javac and JAVA_HOME must all use JDK 21. Reopen the terminal after changing PATH.');
  }
  command('git', ['--version']);
  command(windows ? 'npm.cmd' : 'npm', ['--version']);
}

function maven(offline) {
  if (offline) {
    const distributions = path.join(env.MAVEN_USER_HOME || path.join(homedir(), '.m2'), 'wrapper', 'dists');
    const executable = windows ? 'mvn.cmd' : 'mvn';
    if (!existsSync(distributions) || !readdirSync(distributions, { recursive: true }).some(file => file.split(path.sep).join('/').endsWith(`apache-maven-3.9.16/bin/${executable}`))) {
      throw new Error('Maven 3.9.16 is not cached. Run prepare.cmd online first.');
    }
  }
  const args = ['--batch-mode', '--no-transfer-progress'];
  if (offline) args.push('-o');
  if (env.ENVIRONMENT_CHECK_CACHE_ROOT) args.push(`-Dmaven.repo.local=${path.join(env.MAVEN_USER_HOME, 'repository')}`);
  const version = command(path.join(root, windows ? 'mvnw.cmd' : 'mvnw'), [...args, '--version']);
  if (!version.includes('Apache Maven 3.9.16')) throw new Error('Maven Wrapper must run Maven 3.9.16.');
  command(path.join(root, windows ? 'mvnw.cmd' : 'mvnw'), [...args, 'clean', 'install']);
}

async function assertPortAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} is occupied. Close the application using it and retry.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

function start(program, args, cwd) {
  const child = spawn(program, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const state = { child, error: null, exited: false };
  children.add(state);
  child.on('error', error => { state.error = error; });
  child.on('exit', () => { state.exited = true; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => appendFileSync(log, data));
  return state;
}

async function waitFor(url, state) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (state.error) throw state.error;
    if (state.exited) throw new Error(`Service exited before ${url} was ready. See the log.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}. See the log.`);
}

async function stopServices() {
  const pending = [...children].map(state => {
    if (state.exited || state.error) return Promise.resolve();
    return new Promise(resolve => {
      state.child.once('exit', resolve);
      state.child.kill();
      const timeout = setTimeout(() => { if (!state.exited) state.child.kill('SIGKILL'); resolve(); }, 5000);
      timeout.unref();
    });
  });
  await Promise.all(pending);
  children.clear();
}

async function run(offline) {
  stage = offline ? 'offline Maven build and tests' : 'Maven download, build and tests';
  note(`\n=== ${offline ? 'OFFLINE MODE' : 'ONLINE PREPARATION'} ===`);
  maven(offline);
  stage = offline ? 'offline npm installation and frontend build' : 'npm download and frontend build';
  command(windows ? 'npm.cmd' : 'npm', ['ci', ...(offline ? ['--offline'] : []), '--no-audit', '--no-fund'], frontend);
  command(windows ? 'npm.cmd' : 'npm', ['run', 'build'], frontend);
  command(windows ? 'npm.cmd' : 'npm', ['run', 'check:api'], frontend);
  if (!offline) {
    stage = 'Chromium download';
    command(process.execPath, ['node_modules/@playwright/test/cli.js', 'install', 'chromium'], frontend);
  }
  stage = 'Spring Boot, H2 and browser check';
  await assertPortAvailable(18080);
  await assertPortAvailable(15173);
  try {
    const backend = start(path.join(env.JAVA_HOME, 'bin', windows ? 'java.exe' : 'java'), ['-jar', 'backend/target/environment-backend.jar'], root);
    await waitFor('http://127.0.0.1:18080/api/environment', backend);
    const ui = start(process.execPath, ['node_modules/vite/bin/vite.js'], frontend);
    await waitFor('http://127.0.0.1:15173', ui);
    command(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], frontend);
  } finally { await stopServices(); }
}

async function main() {
  const mode = process.argv[2];
  if (!['prepare', 'offline'].includes(mode)) throw new Error('Usage: node scripts/readiness.mjs prepare|offline');
  configureCache();
  note(`Environment Check ${readFileSync(path.join(root, 'VERSION'), 'utf8').trim()}`);
  prerequisites();
  await assertPortAvailable(18080);
  await assertPortAvailable(15173);
  if (mode === 'prepare') await run(false);
  await run(true);
  note('\nPASS: Java tests, Spring Boot/H2, React build, OpenAPI and Chromium checks passed.');
  note('Maven/npm offline mode passed. Keep the dependency caches for class.');
  note(`Log: ${log}`);
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await stopServices(); process.exit(1); });
try { await main(); }
catch (error) {
  await stopServices();
  note(`\nFAIL during ${stage}: ${error.message}\nLog: ${log}`);
  process.exitCode = 1;
}
