
var http = require('http'),
    httpProxy = require('http-proxy'),
    HttpProxyRules = require('../');

module.exports = function spawnReverseProxy(cb) {

  // Set up proxy rules instance
  var proxyRules = new HttpProxyRules({
    rules: {
      '.*/test': 'http://localhost:8080/cool', // Rule (1)
      '.*/test2/': 'http://localhost:8080/cool2/', // Rule (2)
      '.*/ipTest1/': { // Rule (3)
          'whitelist': [
              "127.0.0.1/24" // only allow whitelist
          ],
          'target': 'http://localhost:8080/cool3/'
      },
      '.*/ipTest2/': {  // Rule (4)
          'whitelist': [
              "8.8.8.0/24" // only allow whitelist
          ],
          'target': 'http://localhost:8080/cool4/'
      },
      '.*/ipTest3/': {  // Rule (5)
          'whitelist': [
              "127.0.0.1" // only allow whitelist
          ],
          'target': 'http://localhost:8080/cool5/'
      }
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
  }).listen(6010, '0.0.0.0', cb);

};
