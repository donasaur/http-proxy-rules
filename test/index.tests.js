'use strict';

var spawnReverseProxy = require('../example/simple'),
    chai = require('chai'),
    async = require('async'),
    http = require('http'),
    request = require('request'),
    expect = chai.expect;

describe('Proxy Routes', function () {
  var proxyServerPort = 6010;
  var targetPort = 8080;
  var targetFQDN = '127.0.0.1';

  before(function (done) {
    // runs before all tests in this block

    http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        // response includes the url that you tried to access
        translatedPath: req.url
      }));
    }).listen(targetPort, function mockServerReady() {
      spawnReverseProxy(function proxyServerReady() {
        done(); // call done to start running test suite
      });
    });
  });

  after(function (done) {
    // runs after all tests in this block
    done();
  });

  it('should translate the url correctly', function (done) {

    var urlTranslationTests = [{
        // visited path matches rule (1).
        visitedPath: '/test',
        newUrlTarget: targetFQDN + targetPort + '/cool'
      }, {
        // visited path matches rule (1).
        // whatever portion is not part of the match is carried over
        // to the new path.
        // in this case, the '/' is carried over.
        visitedPath: '/test/',
        newUrlTarget: targetFQDN + targetPort + '/cool/'
      }, {
        // visited path matches rule (1).
        // query parameters are carried over.
        visitedPath: '/test?hi=5/',
        newUrlTarget: targetFQDN + targetPort + '/cool?hi=5/'
      }, {
        // visited path matches rule (2).
        // the unmatched portion '/yo' is carried over.
        visitedPath: '/test2/yo',
        newUrlTarget: targetFQDN + targetPort + '/cool2/yo'
      }, {
        // visited path matches rule (1).
        // note that the key is interpreted as a regex expression and the
        // module matches against the visited path, and not the entire url.
        visitedPath: '/fuzzyshoe/test',
        newUrlTarget: targetFQDN + targetPort + '/cool'
      }, {
        // visited path matches rule (1).
        // the unmatched portion '/seven' is carried over.
        visitedPath: '/test/seven',
        newUrlTarget: targetFQDN + targetPort + '/cool/seven'
      }, {
        // no rule matched, so the module uses the specified default target.
        // the entire visited path is carried over.
        // see the `Other Notes` section of README to see why specifying
        // the rule `.*/test` does not match `/testalmost`.
        visitedPath: '/testalmost',
        newUrlTarget: targetFQDN + targetPort + '/testalmost'
      }, {
        // no rule matched, so the module uses the specified default target.
        // the entire visited path is carried over.
        visitedPath: '/testalmost/5',
        newUrlTarget: targetFQDN + targetPort + '/testalmost/5'
      }
    ];

    // makes a bunch of requests in parallel, and then calls
    // `done` after we receive all responses back
    async.each(urlTranslationTests, function makeRequest(comparisonObj, cb) {
      request({
        url: 'http://127.0.0.1:' + proxyServerPort + comparisonObj.visitedPath,
        json: true
      }, function processResp(err, res, body) {

        expect(res.statusCode).to.equal(200);
        expect(targetFQDN + targetPort + body.translatedPath).to.equal(comparisonObj.newUrlTarget);
        cb();
      });
    }, done);

  });

});
