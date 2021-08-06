
/**
 * This is a constructor for a HttpProxyRules instance.
 * @param {Object} options Takes in a `rules` obj, a `hosts` obj, (optional) `default` target
 */
function HttpProxyRules(options) {
  this.rules = options.rules;
  this.hosts = options.hosts;
  this.default = options.default || null;

  return this;
};

/**
 * This function will modify the `req` object if a match is found.
 * We also return the new endpoint string if a match is found.
 * @param  {Object} options Takes in a `req` object.
 */
HttpProxyRules.prototype.match = function match(req) {
  var rules = this.rules;
  var target = this.default;
  var path = req.url;

  // go through the proxy rules, assuming keys (path prefixes) are ordered
  // and pick the first target whose path prefix is a prefix of the
  // request url path. RegExp enabled.
  var pathPrefixRe;
  var testPrefixMatch;
  var urlPrefix;
  var pathEndsWithSlash;
  for (var pathPrefix in rules) {
    if (rules.hasOwnProperty(pathPrefix)) {
      if (pathPrefix[pathPrefix.length - 1] === '/') {
        pathPrefixRe = new RegExp(pathPrefix);
        pathEndsWithSlash = true;
      } else {
        // match '/test' or '/test/' or './test?' but not '/testing'
        pathPrefixRe = new RegExp('(' + pathPrefix + ')' + '(?:\\W|$)');
        pathEndsWithSlash = false;
      }
      testPrefixMatch = pathPrefixRe.exec(path);
      if (testPrefixMatch && testPrefixMatch.index === 0) {
        urlPrefix = pathEndsWithSlash ? testPrefixMatch[0] : testPrefixMatch[1];
        req.url = path.replace(urlPrefix, '');
        target = rules[pathPrefix];
        // We replace matches on the target,
        // e.g. /posts/([0-9]+)/comments/([0-9]+) => /posts/$1/comments/$2
        for (var i = 1; i < testPrefixMatch.length; i++) {
          target = target.replace('$' + i, testPrefixMatch[i + (pathEndsWithSlash ? 0 : 1)]);
        }
        break;
      }
    }
  }

  return target;
}

/**
 * This function will modify the `req` object if a matching host is found.
 * We also return the new endpoint string if a match is found.
 * @param  {Object} options Takes in a `req` object.
 */
HttpProxyRules.prototype.matchHost = function matchHost(req) {
  var hosts = this.hosts;
  var target = this.default;
  reqHost = req.headers['host'];

  for (var host in hosts) {
    if (host === reqHost) {
      target = hosts[host];
      break;
    }
  }
  return target;
}

module.exports = HttpProxyRules;
