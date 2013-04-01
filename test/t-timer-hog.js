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

var tm_ms = new Stats.TimerMS()
  , vl = new Stats.Value("frobs")
  , hogLin = new Stats.Histogram(tm_ms, new Stats.Linear(10, "ms"))
  , hogLMS = new Stats.Histogram(tm_ms, Stats.logMS)
  , hogLLMS = new Stats.Histogram(tm_ms, Stats.linLogMS)
  , hogSLMS = new Stats.Histogram(tm_ms, Stats.semiLogMS)
  , stats = Stats()

//stats.set('test', vl)
stats.set('test', tm_ms)
stats.set('test HOG Linear', hogLin)
stats.set('test HOG logMS', hogLMS)
stats.set('test HOG linLogMS', hogLLMS)
stats.set('test HOG semiLogMS', hogSLMS)

var done_ms = tm_ms.start()
function fire() {
  setTimeout(function(){
    done_ms()
    done_ms = tm_ms.start()
    fire()
  }, rand(999))
}
fire()

setInterval(function(){
  //log(inspect(hog, true, 4))
  log( stats.toString({orient:'vertical', values:'both', hash: true}))
  //log( hog.toString({orient:'horizontal', values:'both'}))
  //log( hog.toString({orient:'horizontal', values:'percentage'}) )
  //log( stats.toString({orient:'horizontal', values:'both'}) )
  log("--")
}, 1000)
