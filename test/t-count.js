#!/usr/bin/env node

var util = require('util')
  , log = console.log
  , Stats = require('..')
  , stats = Stats()
  , rand = require('../lib/utils').rand


stats.createStat('t2', Stats.Count, {units: 'hits'})

setInterval(function(){ stats.get('t2').inc() }, 100)

stats.createStat( 't2_rate', Stats.Rate,
                  { stat    : stats.get('t2')
                  , period  : 1
                  , interval: 1000
                  , units   : 'hits/sec' } )

stats.get('t2_rate').on('reset', function(ovalue) {
  var rate = stats.get('t2_rate')
  log("t2 reset: value=%d; rate=%d; ovalue=%d", rate.value, rate.rate, ovalue)
})

setInterval(function(){ log(stats.get('t2_rate').toString()) }, 1000)
