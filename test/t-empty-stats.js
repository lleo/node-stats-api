#!/usr/bin/env node

var statsmod = require('stats')
  , stats = statsmod.getStats()
  , log = console.log

stats.createStat('foo', 'Value')
stats.createHOG('foo_hog LogMS'    , 'foo', 'LogMS')
stats.createHOG('foo_hog SemiLogMS', 'foo', 'SemiLogMS')
stats.createHOG('foo_hog LinLogMS' , 'foo', 'LinLogMS')

stats.createHOG('foo_hog Bytes'    , 'foo', 'Bytes')
stats.createHOG('foo_hog SemiBytes', 'foo', 'SemiBytes')
stats.createHOG('foo_hog LogBytes' , 'foo', 'LogBytes')

//log( stats.toString({indent:">"}) )
log( stats.toString() )