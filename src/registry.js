'use strict';

// The registry is the heart of the exercise: every feature the codebase
// gains registers itself here, and the app renders whatever it finds.
// Merge a branch and a row appears. Revert a commit and the row disappears.

const features = new Map();

function register(name, meta, fn) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError('register: name must be a non-empty string');
  }
  if (typeof fn !== 'function') {
    throw new TypeError(`register: "${name}" must be registered with a function`);
  }
  if (features.has(name)) {
    throw new Error(`register: "${name}" is already registered (duplicate feature name)`);
  }

  features.set(name, {
    name,
    description: meta?.description ?? '(no description)',
    author: meta?.author ?? 'unknown',
    addedIn: meta?.addedIn ?? 'unreleased',
    fn,
  });

  return name;
}

function list() {
  return [...features.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function get(name) {
  return features.get(name);
}

function call(name, ...args) {
  const entry = features.get(name);
  if (!entry) throw new Error(`call: no feature named "${name}"`);
  return entry.fn(...args);
}

function count() {
  return features.size;
}

// Tests need a clean slate between cases; the app never calls this.
function reset() {
  features.clear();
}

module.exports = { register, list, get, call, count, reset };
