'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../src/registry');
const features = require('../src/features');

// Loads whatever is on disk right now -- so this test grows with the branch
// you are on. That is the point: the suite verifies the codebase as merged.
test('every feature file registers at least one function', () => {
  registry.reset();
  const loaded = features.loadAll();

  assert.ok(loaded.length > 0, 'expected at least one feature file');
  assert.ok(registry.count() >= loaded.length,
    `${loaded.length} file(s) loaded but only ${registry.count()} function(s) registered`);
});

test('the starter greet feature still works', () => {
  assert.equal(registry.call('greet', 'Ada'), 'Hello, Ada!');
});
