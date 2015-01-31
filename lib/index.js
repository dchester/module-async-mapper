var callsite = require('callsite');
var jp = require('./jsonpath');
var util = require('./util');
var path = require('path');
var packagePath = require('package-path');

var ModuleAsyncMap = {

  explore: function(obj, hints) {

    var _hints = { '$..*': 'standard' };
    for (k in hints) _hints[k] = hints[k];
    return this.map(obj, _hints, { loadModuleRules: false });

  },

  map: function(obj, rules, options) {

    options = Object(options);

    var loadModuleRules =
      'loadModuleRules' in options ? options.loadModuleRules : true;

    var map = {};

    if (typeof obj == 'string') {
      var module = this.loadModule(obj);
      obj = module.obj;
      if (loadModuleRules) {
        for (k in module.rules) rules[k] = module.rules[k];
      }
    }

    var rootContinuation = this._root(obj, rules);
    if (rootContinuation) map['$'] = rootContinuation;

    var keys = this._keys(obj, rules);
    for (var k in keys) map[k] = keys[k];

    return map;

  },

  loadModule: function(id) {

      var caller = callsite()[1].getFileName();

      // handle relative paths
      if (id.match(/^(\.\/|\/|\.\.($|\/))/)) {
        var base = path.dirname(caller);
        var id = path.resolve(base, id);
      } 

      file = require.resolve(id);
      obj = require(file);

      try {
        var rules = require(path.join(packagePath.sync(file), '.asyncmap.json'));
      } catch(e) {}

      return { obj: obj, rules: rules };
  },

  guess: function(fn, _default) {

    var continuation;
    _default = _default || 'sync';

    if (_default && _default.match(/^\+/)) {
      _default = _default.substring(1);
      var force = true;
    }

    var continuation =
      force ? _default :
      util.is_generator(fn) ? 'generator' :
      !util.is_function(fn) ? null :
      util.is_probably_promise(fn) ? 'promise' :
      util.is_probably_async(fn) ? (util.guess_callback_scheme(fn) || (_default.match(/simple|standard/) ? _default : 'standard')) :
      'sync';

    return continuation;

  },

  _root: function(obj, hints) {

    hints = Object(hints);
    var _default = hints['$'] || 'standard';

    var continuation = this.guess(obj, _default);
    return continuation;

  },

  _keys: function(obj, hints) {

    var _pass = [];

    // default to testing everything for standard
    if (!hints || !Object.keys(hints).length) {
      hints = { '$..*': 'standard' };
    }

    var normalizedHints = {};

    // apply hints
    Object.keys(hints).forEach(function(pathExpression) {

      var rule = hints[pathExpression];
      if (pathExpression.match(/^~/)) return;
      var nodes = jp.nodes(obj, pathExpression);

      nodes.forEach(function(node) {
        if (node.value == obj) return;
        if (node.value instanceof Function) {
          var pathString = jp.stringify(node.path);
          normalizedHints[pathString] = rule;
        }
      });
    });

    var map = {};

    // guess continuation
    Object.keys(normalizedHints).forEach(function(path) {
      var fn = jp.value(obj, path);
      if (_pass.indexOf(fn) != -1) return;
      _pass.push(fn);
      map[path] = this.guess(fn, normalizedHints[path]);
    }, this);

    return map;
  }

};

module.exports = ModuleAsyncMap;
