var assert = require('assert');
var util = require('../lib/util');

suite('util', function() {

  test('guess callback arity for simple callback', function() {
    var fn = function(cb) { cb('success!') };
    assert.equal(util.guess_callback_scheme(fn), 'simple');
  });

  test('guess callback arity for standard callback', function() {
    var fn = function(cb) { if (0) { cb('error!') } else { cb(null, 'success!') } };
    assert.equal(util.guess_callback_scheme(fn), 'standard');
  });

  test('guess callback arity for standard callback sending error', function() {
    var fn = function(cb) { if (0) { cb('error!') } else { cb(new Error()) } };
    assert.equal(util.guess_callback_scheme(fn), 'standard');
  });

  test('guess callback arity for passing callback', function() {
    var fn = function(cb) { if (0) { cb('error!') } else { console.log(cb) } };
    assert.equal(util.guess_callback_scheme(fn), 'standard');
  });

  if (util.engine_supports_generators()) {
    test('we can detect a generator function', function() {
      eval("var gfn = function*() {}");
      var fn = function() {};
      assert.ok(util.is_generator(gfn));
      assert.ok(!util.is_generator(fn));
    });
  }

});
