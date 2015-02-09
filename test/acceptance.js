var assert = require('assert');
var mm = require('..');
var util = require('../lib/util');

suite('acceptance', function() {

  this.timeout(15000);

  test('fs module', function() {
    var fs = require('fs');
    var map = mm.map(fs);
    var expected = require('./data/fs.json');
    assert.deepEqual(map, expected);
  });

  test('rimraf module', function() {
    var rimraf = require('rimraf');
    var map = mm.map(rimraf);
    assert.deepEqual(map, { "$": "standard", "$.sync": "sync" });
  });

  test('redis module', function() {
    var redis = require('redis');
    var map = mm.map(redis);
    assert.deepEqual(map, require('./data/redis.json'));
  });

  test('pg module', function() {
    var pg = require('pg');
    var map = mm.map(pg);
    assert.deepEqual(map, require('./data/pg.json'));
  });

  test('mkdirp module', function() {
    var map = mm.map('mkdirp');
    assert.deepEqual(map, require('./data/mkdirp.json'));
  });

});
