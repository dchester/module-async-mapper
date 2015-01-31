var JSONPath = require('jsonpath').JSONPath;

var jp = new JSONPath;

jp.handlers.traverse = traverser(true);
jp.handlers.descend = traverser();

jp.handlers.keys = function(obj) {

  var keys = Object.getOwnPropertyNames(obj);

  for (var k in obj) {
    if (keys.indexOf(k) == -1) {
      keys.push(k);
    }
  }
  return keys;
};

function traverser(recurse) {

  return function(partial, ref, passable) {

    var value = partial.value;
    var path = partial.path;

    var results = [];
    var _pass = [];

    var descend = function(value, path) {

      if (value instanceof Object) {
        if (_pass.indexOf(value) != -1) {
          return;
        } else {
          _pass.push(value);
        }
      }

      if (is_array(value)) {
        value.forEach(function(element, index) {
          if (passable(index, element, ref)) {
            results.push({ path: path.concat(index), value: element });
          }
        });
        value.forEach(function(element, index) {
          if (recurse) {
            descend(element, path.concat(index));
          }
        });
      } else if (is_object(value)) {
        this.keys(value).forEach(function(k) {
          if (_is_getter(value, k)) return;
          if (passable(k, value[k], ref)) {
            results.push({ path: path.concat(k), value: value[k] });
          }
        })
        this.keys(value).forEach(function(k) {
          if (_is_getter(value, k)) return;
          if (recurse) {
            descend(value[k], path.concat(k));
          }
        });
      }
    }.bind(this);
    descend(value, path);
    return results;
  }
}

function is_array(val) {
  return Array.isArray(val);
}

function is_object(val) {
  // is this a non-array, non-null object?
  return val && !(val instanceof Array) && val instanceof Object;
}

function _is_getter(obj, key) {
  var desc = Object.getOwnPropertyDescriptor(obj, key);
  if (desc !== null && desc !== undefined && desc.get) {
    return true;
  }
}

module.exports = jp;
