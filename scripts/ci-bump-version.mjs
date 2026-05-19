#!/usr/bin/env node
import fs from 'fs/promises';
import { execSync } from 'child_process';

const pkgPath = 'package.json';
const readPkg = async () => JSON.parse(await fs.readFile(pkgPath, 'utf8'));

try {
  const pkg = await readPkg();
  const oldVersion = (pkg.version || '0.0.0').split('-')[0];
  const parts = oldVersion.split('.').map(n => parseInt(n, 10));
  if (parts.length < 3 || parts.some(isNaN)) throw new Error('Invalid semver in package.json');
  let [major, minor, patch] = parts;

  if (patch >= 9) {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  if (newVersion === oldVersion) {
    console.log('Version unchanged:', oldVersion);
    process.exit(0);
  }

  pkg.version = newVersion;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`Bumped ${oldVersion} → ${newVersion}`);

  // Configure git and commit
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');

  // Only commit if there are changes
  const status = execSync('git status --porcelain').toString().trim();
  if (!status) {
    console.log('No changes to commit');
    process.exit(0);
  }

  execSync(`git add ${pkgPath}`);
  try {
    execSync(`git commit -m "chore(ci): bump version to v${newVersion} [ci skip]"`);
  } catch (err) {
    console.log('Commit failed (possibly no changes):', err.message);
  }

  try {
    execSync(`git tag v${newVersion}`);
  } catch (err) {
    console.log('Tagging failed (maybe tag exists):', err.message);
  }

  // Push commit and tags (actions/checkout with token permits this)
  try {
    execSync('git push --follow-tags');
  } catch (err) {
    console.error('Push failed:', err.message);
    process.exit(1);
  }

} catch (err) {
  console.error('ci-bump-version error:', err.message);
  process.exit(1);
}
