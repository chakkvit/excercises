'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../src/registry');

test.beforeEach(() => registry.reset());

test('registers a function and lists it', () => {
  registry.register('add', { description: 'adds', author: 'me', addedIn: 'v1.0.0' }, (a, b) => a + b);

  const [entry] = registry.list();
  assert.equal(registry.count(), 1);
  assert.equal(entry.name, 'add');
  assert.equal(entry.description, 'adds');
  assert.equal(entry.author, 'me');
  assert.equal(entry.addedIn, 'v1.0.0');
});

test('calls a registered function', () => {
  registry.register('double', {}, (n) => n * 2);
  assert.equal(registry.call('double', 21), 42);
});

test('fills in defaults for missing metadata', () => {
  registry.register('bare', {}, () => null);
  const entry = registry.get('bare');
  assert.equal(entry.description, '(no description)');
  assert.equal(entry.author, 'unknown');
  assert.equal(entry.addedIn, 'unreleased');
});

test('rejects a duplicate name', () => {
  registry.register('dupe', {}, () => 1);
  assert.throws(() => registry.register('dupe', {}, () => 2), /already registered/);
});

test('rejects a nameless or non-function registration', () => {
  assert.throws(() => registry.register('', {}, () => 1), TypeError);
  assert.throws(() => registry.register('nope', {}, 'not a function'), TypeError);
});

test('rejects calling an unknown feature', () => {
  assert.throws(() => registry.call('ghost'), /no feature named/);
});

test('lists features sorted by name', () => {
  registry.register('zeta', {}, () => 1);
  registry.register('alpha', {}, () => 1);
  assert.deepEqual(registry.list().map((f) => f.name), ['alpha', 'zeta']);
});
