#!/usr/bin/env node

var util = require('util')
  , log = console.log
  , Stats = require('..')
  , stats = Stats()
  , fprintf = require('printf')
  , rand = require('../lib/utils').rand

var printf = function printf() {
  var args = Array.prototype.slice.call(arguments)
  args.unshift(process.stdout)
  fprintf.apply(undefined, args)
}

// Declare Stat(s)
stats.createStat('t0', Stats.TimerMS)
stats.createStat('t1', Stats.TimerNS)
stats.get('t0').on('value', function(v){
  printf("t0                = %5.3f\n", v/1000)
})
stats.get('t1').on('value', function(v){
  printf("t1                = %5.3f\n", v/1000)
})

stats.createStat( 't0_mavg', Stats.MovingAverage
                , {nelts: 3, stat: stats.get('t0')} )
stats.get('t0_mavg').on('value', function(v){
  printf("t0 MovingAverage  = %5.3f\n", v/1000)
})
stats.createStat( 't1_mavg', Stats.MovingAverage
                , {nelts: 3, stat: stats.get('t1')} )
stats.get('t1_mavg').on('value', function(v){
  printf("t1 MovingAverage  = %5.3f\n", v/1000)
})

stats.createStat( 't0_ravg', Stats.RunningAverage
                , {nelts: 3, stat: stats.get('t0')} )
stats.get('t0_ravg').on('value', function(v){
  printf("t0 RunningAverage = %5.3f\n", v/1000)
})
stats.createStat( 't1_ravg', Stats.RunningAverage
                , {nelts: 3, stat: stats.get('t1')} )
stats.get('t1_ravg').on('value', function(v){
  printf("t1 RunningAverage = %5.3f\n", v/1000)
})

// Stat generator
function doit() {
  var t = rand(3000)
    , done_t0 = stats.get('t0').start()
    , done_t1 = stats.get('t1').start()

  setTimeout(function(){
    done_t0()
    done_t1()
    log("--")
    doit()
  }, t)
}

// Start it off
doit()
