#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , Stats = require('..')
  , stats = Stats()
  , log = console.log

var DIR = process.argv[2] || '.'
log("DIR=%s", DIR)

stats.createStat('file_sz', Stats.Value)
stats.createHOG('file_sz_hog_reg' , 'file_sz', Stats.Bytes)
stats.createHOG('file_sz_hog_semi', 'file_sz', Stats.SemiBytes)
stats.createHOG('file_sz_hog_log' , 'file_sz', Stats.LogBytes)

stats.createStat('time_to_stat', Stats.Timer)
stats.createHOG('time_to_stat_hog_reg' , 'time_to_stat', Stats.LogMS)
stats.createHOG('time_to_stat_hog_semi', 'time_to_stat', Stats.SemiLogMS)
stats.createHOG('time_to_stat_hog_log' , 'time_to_stat', Stats.LinLogMS)

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

      //log( stats.toString({indent:'', values:'both'}) )
      log( stats.toString({indent:'', hash:true}) )
    })
})
