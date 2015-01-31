var assert = require('assert');
var mapper = require('..');

suite('map-configure', function() {

  test('sample async calc', function() {
    var map = mapper.explore(AsyncCalc);
    assert.deepEqual(map, { '$.add': 'standard', '$.echo': 'sync', '$.sneakyEcho': 'sync' });
  });

  test('hints get applied', function() {
    var map = mapper.explore(AsyncCalc, { 'sneakyEcho': '+standard' });
    assert.deepEqual(map, { '$.add': 'standard', '$.echo': 'sync', '$.sneakyEcho': 'standard' });
  });

  test('sample async calc constructor', function() {
    var map = mapper.explore(AsyncConstructorCalc, { 'sneakyEcho': '+standard' });
    assert.deepEqual(map, { '$': 'standard', '$.echoAsync': 'standard', '$.dump': 'sync' });
  });

  test('sample async calc configure', function() {
    var map = mapper.map(AsyncCalc, { 'add': 'standard', 'sneakyEcho': '+standard' });
    assert.deepEqual(map, { '$.add': 'standard', '$.sneakyEcho': 'standard' });
  });

  test('configure top-level only async', function() {
    var map = mapper.map(AsyncConstructorCalc, { '$': 'standard' });
    assert.deepEqual(map, { '$': 'standard' });
  });

});

var AsyncCalc = {
  add: function(a, b, callback) { callback(null, a + b) },
  echo: function() { console.log(arguments) },
  sneakyEcho: function() { arguments[1](null, arguments[0]) },
  version: '0.0.1',
}

var AsyncConstructorCalc = function(callback) {
  callback(null, AsyncCalc);
}

AsyncConstructorCalc.version = '0.0.2';
AsyncConstructorCalc.dump = function() { console.log(this) };
AsyncConstructorCalc.echoAsync = function(value, cb) { cb(null, value) };
