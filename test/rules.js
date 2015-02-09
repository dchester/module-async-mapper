var assert = require('assert');
var mapper = require('..');

suite('module-rules', function() {

  test('we pick up .asyncmap.json files', function() {
    var module = mapper.loadModule('./lib/echo');
    assert.deepEqual(module.hints, { 'say': '+standard' });
  });

  test('loading module with no config file goes okay', function() {
    var module = mapper.loadModule('./lib/calc');
    assert.deepEqual(module.hints, undefined);
  });

});
