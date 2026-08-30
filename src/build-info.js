'use strict';

// deploy.sh writes build-info.json at deploy time. When you run `node app.js`
// straight from your working tree there is no such file, and that is fine --
// the app then reports itself as a dev run.

const fs = require('node:fs');
const path = require('node:path');

function read() {
  const file = path.join(__dirname, '..', 'build-info.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {
      version: 'dev',
      branch: '(not deployed)',
      commit: '(not deployed)',
      subject: 'Running straight from the working tree -- use ./deploy.sh for a real build.',
      deployedAt: null,
    };
  }
}

module.exports = { read };
