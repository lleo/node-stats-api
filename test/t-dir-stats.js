#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , inspect = util.inspect
  , format = util.format
  , async = require('async')
  , statsmod = require('stats')
  , stats = statsmod.getStats()
  , utils = require('../lib/utils')
  , log = console.log

var DIR
DIR = process.argv[2] || '.'
log("DIR=%s", DIR)

stats.createStat('file_sz', 'Value')
stats.createHOG('file_sz_hog_reg' , 'file_sz', 'Bytes')
stats.createHOG('file_sz_hog_semi', 'file_sz', 'SemiBytes')
stats.createHOG('file_sz_hog_log' , 'file_sz', 'LogBytes')

stats.createStat('time_to_stat', 'Timer')
stats.createHOG('time_to_stat_hog_reg' , 'time_to_stat', 'LogMS')
stats.createHOG('time_to_stat_hog_semi', 'time_to_stat', 'SemiLogMS')
stats.createHOG('time_to_stat_hog_log' , 'time_to_stat', 'LinLogMS')

fs.readdir(DIR, function(err, files){
  var files = files.map(function(file){
    return path.join(DIR, file)
  })
  async.map(files, 
    function(file, cb){
      var done = stats.get('time_to_stat').start()
      fs.lstat(file, function(err, stat){
        done(err)
        if (err) return cb(err)
        cb(null, {file: file, stat: stat})
      })
    }
  , function(err, results){
      if (err) {
        log("async.map error:", err)
        return
      }
      results.forEach(function(ent){
        if (ent.stat.isFile())
          stats.get('file_sz').set(ent.stat.size)
      })

      log( stats.toString({indent:'', values:'both'}) )
    })
})

