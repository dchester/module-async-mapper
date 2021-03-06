[![Build Status](https://travis-ci.org/dchester/module-async-mapper.png?branch=master)](https://travis-ci.org/dchester/module-async-mapper)

# module-async-mapper

Discover and specify module methods' continuation schemes (callbacks vs promises vs generator functions, etc)

#### mapper.map(module[, hints, options])

Traverses the module and returns a [JSONPath](https://github.com/dchester/jsonpath) style map of the given module's methods, along with a heuristic best guess at their continuation scheme, accepting hints to inform guesses.

```javascript
var mapper = require('module-async-mapper');
var fs = require('fs');
var map = mapper.map(fs);

// {
//   '$.readFile': 'standard',
//   '$.readFileSync': 'sync',
//   '$.writeFile': 'standard',
//   '$.writeFileSync': 'sync',
//   '$.exists': 'simple',
//   '$.existsSync': 'sync',
//   ...
// }
```

Hints are in the form of an object with JSONPath keys pointing to continuation scheme identifiers, optionally preceded by a `+` to force that option to take effect.

And another example: The `mkdirp` module exports a function that accepts a standard node callback, but that happens to be difficult to ascertain programmatically so we provide a hint.

```javascript
var mapper = require('module-async-map');
var mkdirp = require('mkdirp');
var map = mapper.map(mkdirp, { '$': '+standard' });

// {
//  '$': 'standard',
//  '$.sync': 'sync'
// }
```

If `module` is a string, it will be resolved as `require` would do, and any hints in `.asyncmap.json` in the module's source root will be applied with `hints` merged on top, as well as any local hints from this package.

Takes the following options:

- `traverseAll` - Traverse the whole object rather than just the parts that match keys in hints; defaults to `true`
- `loadModuleHints` - Load any hints from `.asyncmap` files in module source root; defaults to `true`
- `loadLocalHints` - Load any hints from `hints` in this here module; defaults to `true`

#### mapper.scheme(fn)

Given a function returns a continuation scheme identifier based on a heuristic best guess.  For example, detect a plain old synchronous function:

```javascript
var scheme = mapper.scheme(function(a, b) { return a + b });
// "sync"
```
Or detect a function that accepts a standard callback:

```javascript
var scheme = mapper.scheme(function(a, b, callback) { return callback(null, a + b) });
// "standard"
```

## Continuation Schemes

JavaScript has a few options/conventions for continuing execution with the result of some asynchronous action.

#### Standard Node Callback

> `standard`

The most common and scheme is the `standard` node callback -- a function that accepts an error as the first parameter and a return value as the second.

```javascript
fs.readFile('/etc/passwd', function(err, contents) {
  console.log(contents);
});
```

#### Simple Callback

> `simple`

An optimistic callback function, accepting just the return value as the first paramater, with no intrinsic mechanism for reporting error.

```javascript
fs.exists('/etc/passwd', function(exists) {
  console.log(exists ? "File exists" : "File does not exist");
});
```

#### Promise

> `promise`

A promise is an instance of a Promise from [ES6 promises](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-constructor) / [bluebird](https://github.com/petkaantonov/bluebird) / etc.

```javascript
File.read('/etc/passwd')
  .then(function(contents) { console.log(contents) });
```

#### Generator Function

> `generator`

A generator function may perform asynchronous work and assign results of that work via `yield`ing within its body.  Requires a framework like [suspend](https://github.com/jmar777/suspend) as an intermediary.

```javascript
suspend(function*() {
  var contents = yield read('/etc/passwd');
  console.log(contents);
})();
```

#### Synchronous Return

> `sync`

A regular old function that directly returns the result of its work, potentially blocking the event loop for any I/O operations.

```javascript
var contents = fs.readFileSync('/etc/passwd');
console.log(contents);
```

## License

MIT

