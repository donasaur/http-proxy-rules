
/**
 * This is a constructor for a HttpProxyRules instance.
 * @param {Object} options Takes in a `rules` obj, (optional) `default` target
 */
function HttpProxyRules(options) {
  this.rules = options.rules;
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
        break;
      }
    }
  }

  return target;
}

module.exports = HttpProxyRules;
