
http-proxy-rules
======

[![Build Status](https://travis-ci.org/donasaur/http-proxy-rules.svg?branch=master)](https://travis-ci.org/donasaur/http-proxy-rules)

`http-proxy-rules` is an add-on module to the [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) library. It lets you define a set of rules to translate matching routes to target routes that the reverse proxy service will talk to on the client's behalf.

## Installation
```sh
npm install http-proxy-rules --save
```

## Example Use Case
```js
  var http = require('http'),
      httpProxy = require('http-proxy'),
      HttpProxyRules = require('http-proxy-rules');

  // Set up proxy rules instance
  var proxyRules = new HttpProxyRules({
    rules: {
      '.*/test': 'http://localhost:8080/cool', // Rule (1)
      '.*/test2/': 'http://localhost:8080/cool2/' // Rule (2)
    },
    default: 'http://localhost:8080' // default target
  });

  // Create reverse proxy instance
  var proxy = httpProxy.createProxy();

  // Create http server that leverages reverse proxy instance
  // and proxy rules to proxy requests to different targets
  http.createServer(function(req, res) {

    // a match method is exposed on the proxy rules instance
    // to test a request to see if it matches against one of the specified rules
    var target = proxyRules.match(req);
    if (target) {
      return proxy.web(req, res, {
        target: target
      });
    }

    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('The request url and path did not match any of the listed rules!');
  }).listen(6010, cb);
```

Given the object we used to initialize the `HttpProxyRules` instance above, here are some [**examples**](test/index.tests.js#L38) of how sample url paths would be translated.

## Options

You can initialize a new `http-proxy-rules` instance with the following options:

```js
{
  rules: {}, // See notes below
  default: '' // (optional) if no rules matched, translate url path to specified default
}
```
The rules object contains a set of key-value pairs mapping a regex-supported url path to a target route. The module only tries to match the visited url path, and not the entire url, with a specified rule. The target route must include the protocol (e.g., http) and the FQDN. See the [tests](test/index.tests.js) for examples of how incoming route url paths may be translated with the use of this module.

## Other Notes
* `(?:\\W|$)` is appended to the end of the regex-supported url path, so that if there is a key like  `.*/test` in the rules, the module matches paths `/test`, `/test/`, `/test?` but not `/testing`.
* As long as object keys continued to be ordered in V8, if there are multiple rules that match against a given url path, the module will pick the matching rule listed first for the translation.
