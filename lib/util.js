var esprima = require('esprima');
var jp = require('jsonpath');

module.exports = {

  dict: {
    callbackName: '(callback|cb|done|fn)',
    errorName: /^(e|er|err|error|fail)$/i
  },

  is_probably_async: function(fn) {
    var fnLine = fn.toString().split('\n').shift();
    if (!fnLine.match(this.dict.callbackName)) return;

    var names = this.argument_names(fn) || [];
    if (String(names[names.length - 1]).replace('_', '').match(new RegExp('^' + this.dict.callbackName + '$', 'i'))) {
      return true;
    }
  },

  guess_callback_scheme: function(fn) {

    var names = this.argument_names(fn) || [];
    var name = names.pop();
    var tree = esprima.parse('(' + fn.toString() + ')');

    if (!name.match(/[a-zA-Z_]/)) return null;

    var nodes = jp.query(tree, '$..*');

    var callbackNodes = [];
    var callNodes = [];
    var callbackPass = null;

    nodes.forEach(function(node) {
      if (node && typeof node == "object" && node.type == "CallExpression" && node.callee) {
        if (node.callee.name == name) {
          callbackNodes.push(node);
        } else {
          if (node.arguments.filter(function(a) { return a.name == name }).length) {
            callbackPass = true;
          }
        }
      }
    });

    if (callbackPass) return 'standard';

    var arity = Math.max.apply(null, callbackNodes.map(function(n) { return n.arguments.length || 0 }));

    var firstErrArg = false;

    callbackNodes.forEach(function(node) {

      var args = node.arguments;
      if (!args || !args[0]) return;

      var arg = args[0];

      if (arg.name && arg.name.match(this.dict.errorName)) {
        firstErrArg = true;
      }
      if (arg.type == "NewExpression" && arg.callee && arg.callee.name == "Error") {
        firstErrArg = true;
      }
    }, this);

    if (arity == 1 && !firstErrArg) {
      return 'simple';
    } else if (arity >= 2 || firstErrArg) {
      return 'standard';
    } else {
      return null;
    }
  },

  is_probably_promise: function(fn) {
    return Boolean(fn.toString().match(/return new Promise/));
  },

  is_generator: function(fn) {

    if (!_engine_supports_generators) return;
    if (typeof fn != "function") return;
    if (fn.constructor.name != "GeneratorFunction") return;

    return true;
  },

  is_function: function(fn) {

    if (typeof fn != "function") return;
    if (fn.constructor.name != "Function") return;

    return true;
  },

  argument_names: function(fn) {

    var fnLine = fn.toString().split('\n').shift();
    if (fnLine.match(/{\s*$/)) fnLine += '}';

    var exp = '(' + fnLine + ')';

    try {
      var tree = esprima.parse(exp);
      var params = tree.body[0].expression.params.map(function(x) { return x.name });
    } catch (e) {}

    return params || [];
  },

  engine_supports_generators: function() {
    return _engine_supports_generators;
  }
}

try {
  /* jshint -W061 */
  eval("(function*(){})");
  var _engine_supports_generators = true;
} catch (e) {}
