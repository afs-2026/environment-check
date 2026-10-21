import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim();
if (realpathSync(repository) !== realpathSync(root)) throw new Error('Package must be built from the environment-check Git repository.');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const output = path.resolve(process.argv[2] || path.join(root, 'dist'));
mkdirSync(output, { recursive: true });
const files = [
  'README.md', 'VERSION', 'pom.xml', 'mvnw', 'mvnw.cmd',
  '.mvn/wrapper/maven-wrapper.properties', '.mvn/wrapper/maven-wrapper.jar',
  'prepare.cmd', 'verify-offline.cmd', 'scripts/readiness.mjs',
  'java-basics/pom.xml', 'java-basics/src/main/java/training/environment/JavaCheck.java',
  'java-basics/src/test/java/training/environment/JavaCheckTest.java',
  'backend/pom.xml', 'backend/src/main/java/training/environment/EnvironmentApplication.java',
  'backend/src/main/java/training/environment/Probe.java',
  'backend/src/main/java/training/environment/ProbeRepository.java',
  'backend/src/main/java/training/environment/EnvironmentController.java',
  'backend/src/main/resources/application.properties',
  'backend/src/test/java/training/environment/EnvironmentTest.java',
  'frontend/package.json', 'frontend/package-lock.json', 'frontend/index.html',
  'frontend/src/main.tsx', 'frontend/tsconfig.json', 'frontend/vite.config.mjs',
  'frontend/playwright.config.mjs', 'frontend/tests/environment.spec.mjs',
  'frontend/openapi.json', 'frontend/check-openapi.mjs'
];
for (const file of files) if (!existsSync(path.join(root, file))) throw new Error(`Missing package input: ${file}`);
if (execFileSync('git', ['diff', '--name-only', revision, '--', ...files], { cwd: root, encoding: 'utf8' }).trim()) {
  throw new Error('Commit package input changes before building the delivery ZIP.');
}
const archive = path.join(output, 'environment-check.zip');
// Git archive preserves dotfiles and excludes every file outside this explicit list.
// The release is always built from a committed source tree.
execFileSync('git', ['archive', '--format=zip', `--output=${archive}`, revision, '--', ...files], { cwd: root });
const fingerprint = createHash('sha256').update(readFileSync(archive)).digest('hex');
writeFileSync(path.join(output, 'SHA256SUMS'), `${fingerprint}  environment-check.zip\n`);
console.log(`${archive}\nSHA-256 ${fingerprint}`);
