var callsite = require('callsite');
var jp = require('./jsonpath');
var util = require('./util');
var path = require('path');
var packagePath = require('package-path');
var semver = require('semver');

var ModuleAsyncMap = {

  map: function(input, hints, options) {

    var map = {};
    var obj;

    options = Object(options);
    var _hints = Object(hints);

    var loadModuleHints =
      'loadModuleHints' in options ? options.loadModuleHints : true;

    var loadLocalHints =
      'loadLocalHints' in options ? options.loadLocalHints : true;

    var traverseAll =
      'traverseAll' in options ? options.traverseAll : true;

    hints = traverseAll ? { '$..*': 'standard' } : {};
    for (var k in _hints) hints[k] = _hints[k];

    if (typeof input == 'string') {
      var module = this.loadModule(input);
      obj = module.obj;
      if (loadModuleHints) {
        for (k in module.hints) hints[k] = module.hints[k];
      }
      if (loadLocalHints) {
        var localHints = this.loadHints(input);
        for (k in localHints) hints[k] = localHints[k];
      }
    } else {
      obj = input;
    }

    var rootContinuation = this._root(obj, hints);
    if (rootContinuation) map.$ = rootContinuation;

    var keys = this._keys(obj, hints);
    for (k in keys) map[k] = keys[k];

    return map;
  },

  hints: require("../hints"),

  loadModule: function(id) {

    var file = this._resolveId(id);
    var obj = require(file);

    try {
      var hints = require(path.join(packagePath.sync(file), '.asyncmap.json'));
    } catch (e) {}

    return { obj: obj, hints: hints };
  },

  loadHints: function(name) {

    var file = this._resolveId(name);

    try {
      var pkg = require(path.join(packagePath.sync(file), 'package.json'));
      var version = pkg.version;
    } catch (e) {}

    var matches = [];

    Object.keys(this.hints).forEach(function(key) {
      var comps = key.split('@');
      var _name = comps[0];
      var _version = comps[1] || '*';
      if (name == _name && (version == '*' || semver.satisfies(version, _version))) {
        matches.push(this.hints[key]);
      }
    }.bind(this));

    var hints = {};

    matches.forEach(function(match) {
      for (var key in match) {
        hints[key] = match[key];
      }
    });

    return hints;
  },

  scheme: function(fn, _default) {

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
    var _default = hints.$ || 'standard';

    var continuation = this.scheme(obj, _default);
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
      map[path] = this.scheme(fn, normalizedHints[path]);
    }, this);

    return map;
  },

  _resolveId: function(id) {

    var caller = callsite()[2].getFileName();

    // handle relative paths
    if (typeof id == 'string' && id.match(/^(\.\/|\/|\.\.($|\/))/)) {
      var base = path.dirname(caller);
      id = path.resolve(base, id);
    }

    return require.resolve(id);
  }

};

module.exports = ModuleAsyncMap;
