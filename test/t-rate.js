#!/usr/bin/env node

var util = require('util')
  , log = console.log
  , Stats = require('..')
  , stats = Stats()
  , rand = require('../lib/utils').rand

stats.createStat( 't1', Stats.Value, {units: 'bytes'})

stats.createStat( 't1_rate', Stats.Rate,
                  { units   : 'bytes/sec'
                  , period  : 10
                  , interval: 1000
                  , stat    : stats.get('t1') } )

setInterval(function(){ log( stats.get('t1_rate').toString() ) }, 5000)

function doit() {
  var t = Math.floor(rand(1000))
    , d = Math.floor(rand(1024))
//  log("t=%d; d=%d;", t, d)
  stats.get('t1').set(d)
  setTimeout(doit, t)
}
doit()

//setInterval(doit, 2000)