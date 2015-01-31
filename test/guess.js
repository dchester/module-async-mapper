var assert = require('assert');
var mm = require('..');

suite('guess', function() {

  test('guess standard callback', function() {
    var standardFn = function(options, callback) {
      callback(null, 'done');
    }
    assert.equal(mm.guess(standardFn), 'standard');
  });

  test('guess simple for simple callback', function() {
    var simpleFn = function(options, callback) {
      callback('done');
    }
    assert.equal(mm.guess(simpleFn), 'simple');
  });

  test('guess sync for sync function', function() {
    var syncFn = function(v) { return v };
    assert.equal(mm.guess(syncFn), 'sync');
  });

  test('force guess standard for sync function', function() {
    var syncFn = function(v) { return v };
    assert.equal(mm.guess(syncFn, '+standard'), 'standard');
  });

  test('guess wrong standard for async function', function() {
    var standardFn = function(options, callback) {
      callback(null, 'done');
    }
    assert.equal(mm.guess(standardFn, 'sync'), 'standard');
  });

  test('guess promise for fn that returns a promise', function() {
    var promiseFn = function(options) {
      return new Promise(function(resolve, reject) { resolve('done') });
    };
    assert.equal(mm.guess(promiseFn), 'promise');
  });

});
