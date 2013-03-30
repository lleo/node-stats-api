#!/usr/bin/env node

var Stats = require('..')
  , stats = Stats.getStats()
  , log = console.log

stats.createStat('foo', Stats.Value)
stats.createHOG('foo hog w/LogMS'    , 'foo', Stats.LogMS)
stats.createHOG('foo hog w/SemiLogMS', 'foo', Stats.SemiLogMS)
stats.createHOG('foo hog w/LinLogMS' , 'foo', Stats.LinLogMS)
stats.createHOG('foo hog w/Bytes'    , 'foo', Stats.Bytes)
stats.createHOG('foo hog w/SemiBytes', 'foo', Stats.SemiBytes)
stats.createHOG('foo hog w/LogBytes' , 'foo', Stats.LogBytes)

//log( stats.toString({indent:">"}) )
log( stats.toString() )