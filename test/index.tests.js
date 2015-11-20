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
  var targetPrefix = '127.0.0.1:' + targetPort;

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

    // Feel free to add more cases
    var urlTranslationTests = [{
        visitedPath: '/test',
        newUrlTarget: targetPrefix + '/cool'
      }, {
        visitedPath: '/test/',
        newUrlTarget: targetPrefix + '/cool/'
      }, {
        visitedPath: '/test?hi=5/',
        newUrlTarget: targetPrefix + '/cool?hi=5/'
      }, {
        visitedPath: '/test2/yo',
        newUrlTarget: targetPrefix + '/cool2/yo'
      }, {
        visitedPath: '/fuzzyshoe/test',
        newUrlTarget: targetPrefix + '/cool'
      }, {
        visitedPath: '/test/seven',
        newUrlTarget: targetPrefix + '/cool/seven'
      }, {
        // should match /test but not /testalmost
        visitedPath: '/testalmost',
        newUrlTarget: targetPrefix + '/testalmost'
      }, {
        visitedPath: '/testalmost/5',
        newUrlTarget: targetPrefix + '/testalmost/5'
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
        expect(targetPrefix + body.translatedPath).to.equal(comparisonObj.newUrlTarget);
        cb();
      });
    }, done);

  });

});
