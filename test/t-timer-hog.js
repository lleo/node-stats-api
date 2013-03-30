#!/usr/bin/env node

var Stats = require('..')
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

var tm = new Stats.Timer()
  , vl = new Stats.Value("frobs")
  //, hog = new Stats.Histogram(vl, new Stats.Linear(10, "u"))
  //, hog = new Stats.Histogram(tm, new Stats.LogMS())
  , hog = new Stats.Histogram(tm, new Stats.LinLogMS())
  //, hog = new Stats.Histogram(tm, new Stats.SemiLogMS())
  , stats = Stats()

//stats.set('test', vl)
stats.set('test', tm)
stats.set('test_hog', hog)

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
  log( stats.toString({orient:'horizontal', values:'both'}) )
  log("--")
}, 1000)
