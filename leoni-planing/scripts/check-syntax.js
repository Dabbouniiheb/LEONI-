const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const sourceDirectories = [
  'config',
  'controllers',
  'middlewares',
  'models',
  'routes',
  'services',
  'utils',
  'validations',
  path.join('views', 'assets', 'js')
];
const excludedDirectories = new Set([
  'node_modules',
  '.git',
  '.agents',
  '__MACOSX',
  'archives',
  'generated',
  'reports',
  'rapport_stage'
]);

function collectJavaScriptFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectJavaScriptFiles(fullPath, files);
    } else if (entry.isFile() && path.extname(entry.name) === '.js') {
      files.push(fullPath);
    }
  }

  return files;
}

const files = sourceDirectories
  .map((directory) => path.join(projectRoot, directory))
  .filter((directory) => fs.existsSync(directory))
  .flatMap((directory) => collectJavaScriptFiles(directory))
  .sort();
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    windowsHide: true
  });

  if (result.status !== 0) {
    failures.push({ file, output: result.stderr || result.stdout });
  }
}

if (failures.length > 0) {
  console.error(`Syntax check failed for ${failures.length} of ${files.length} files:`);
  for (const failure of failures) {
    console.error(path.relative(projectRoot, failure.file));
    if (failure.output) {
      console.error(failure.output.trim());
    }
  }
  process.exitCode = 1;
} else {
  console.log(`Syntax check passed: ${files.length}/${files.length} files`);
}
