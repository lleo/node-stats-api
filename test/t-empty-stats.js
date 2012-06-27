#!/usr/bin/env node

var statsmod = require('stats')
  , stats = statsmod.getStats()
  , log = console.log

stats.createStat('foo', statsmod.Value)
stats.createHOG('foo hog w/LogMS'    , 'foo', statsmod.LogMS)
stats.createHOG('foo hog w/SemiLogMS', 'foo', statsmod.SemiLogMS)
stats.createHOG('foo hog w/LinLogMS' , 'foo', statsmod.LinLogMS)
stats.createHOG('foo hog w/Bytes'    , 'foo', statsmod.Bytes)
stats.createHOG('foo hog w/SemiBytes', 'foo', statsmod.SemiBytes)
stats.createHOG('foo hog w/LogBytes' , 'foo', statsmod.LogBytes)

//log( stats.toString({indent:">"}) )
log( stats.toString() )