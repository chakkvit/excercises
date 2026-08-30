'use strict';

// Auto-loads every feature file in this directory.
//
// This is deliberate. If features had to be listed by hand, every branch
// would edit the same list and every merge would conflict in the same
// boring place. Dropping a file in is enough -- so conflicts happen where
// real conflicts happen: inside the code two people actually changed.

const fs = require('node:fs');
const path = require('node:path');

function loadAll() {
  const dir = __dirname;
  const loaded = [];

  for (const file of fs.readdirSync(dir).sort()) {
    if (file === 'index.js') continue;
    if (!file.endsWith('.js')) continue;
    require(path.join(dir, file));
    loaded.push(file);
  }

  return loaded;
}

module.exports = { loadAll };
