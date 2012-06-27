#!/usr/bin/env node

var stats = require('stats')
  , util = require('util')
  , format = util.format
  , inspect = util.inspect
  , log = console.log
  , utils = require('../lib/utils')
  , logf = utils.logf
  , rand = utils.rand

function sin_rand(x) {
  var r = rand(2*Math.PI)
    , s = 1+Math.sin(r)
    , rv = x*s
  return rv
}

var tm = new stats.Timer()
  , vl = new stats.Value("frobs")
  //, hog = new stats.Histogram(vl, new stats.Linear(10, "u"))
  //, hog = new stats.Histogram(tm, new stats.LogMS())
  , hog = new stats.Histogram(tm, new stats.LinLogMS())
  //, hog = new stats.Histogram(tm, new stats.SemiLogMS())
  , ns = stats.getStats()

//ns.set('test', vl)
ns.set('test', tm)
ns.set('test_hog', hog)

var done = tm.start()
function fire() {
  setTimeout(function(){
    done()
    done = tm.start()
//    vl.set(sin_rand(50))
    fire()
//  }, 10)
  }, rand(999))
}
fire()

setInterval(function(){
  //log(inspect(hog, true, 4))
  //log( hog.toString({orient:'vertical', values:'both', hash: true}))
  //log( hog.toString({orient:'horizontal', values:'both'}))
  //log( hog.toString({orient:'horizontal', values:'percentage'}) )
  log( ns.toString({orient:'horizontal', values:'both'}) )
  log("--")
}, 1000)
