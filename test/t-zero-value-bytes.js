#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , inspect = util.inspect
  , async = require('async')
  , statsmod = require('stats')
  , stats = statsmod.getStats()
  , utils = require('../lib/utils')
  , log = console.log

//log(inspect(statsmod))
log("argv=%s", inspect(process.argv))

//DIR = process.argv[2]
//log("DIR=%s", DIR)

function log2(v) { return Math.log(v)/Math.LN2 }
function order2(v) { return Math.floor(log2(v)) }

var v = 0
//log("Math.log(%d) => %d", v, Math.log(v))
//log("log2(%d) => %d", v, log2(v))

stats.createStat('file_sz', statsmod.Value)
stats.createHog('file_sz_hog', 'file_sz', statsmod.Bytes)
stats.createHog('file_sz_hog', 'file_sz', statsmod.LogBytes)

stats.get('file_sz').set(0)
log(stats.toString())
