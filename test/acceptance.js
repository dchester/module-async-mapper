var assert = require('chai').assert;
var mm = require('..');
var util = require('../lib/util');

suite('acceptance', function() {

  this.timeout(15000);

  test('fs module', function() {
    var fs = require('fs');
    var map = mm.map(fs);
    var expected = require('./data/fs.json');
    assert.deepContains(map, expected);
  });

  test('rimraf module', function() {
    var rimraf = require('rimraf');
    var map = mm.map(rimraf);
    assert.deepContains(map, { "$": "standard", "$.sync": "sync" });
  });

  test('redis module', function() {
    var redis = require('redis');
    var map = mm.map(redis);
    assert.deepContains(map, require('./data/redis.json'));
  });

  test('pg module', function() {
    var pg = require('pg');
    var map = mm.map(pg);
    assert.deepContains(map, require('./data/pg.json'));
  });

  test('mkdirp module', function() {
    var map = mm.map('mkdirp');
    assert.deepContains(map, require('./data/mkdirp.json'));
  });
});

function pairs(obj) {
  var p = [];
  Object.keys(obj).forEach(function(k) {
    p.push([k, obj[k]]);
  });
  return p;
}

assert.deepContains = function(expected, actual, message) {
  if (typeof expected == 'object') expected = pairs(expected);
  if (typeof actual == 'object') actual = pairs(actual);
  return assert.includeDeepMembers(expected, actual);
}
