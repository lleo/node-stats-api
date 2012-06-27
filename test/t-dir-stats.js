#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , statsmod = require('stats')
  , stats = statsmod.getStats()
  , log = console.log

var DIR = process.argv[2] || '.'
log("DIR=%s", DIR)

stats.createStat('file_sz', statsmod.Value)
stats.createHOG('file_sz_hog_reg' , 'file_sz', statsmod.Bytes)
stats.createHOG('file_sz_hog_semi', 'file_sz', statsmod.SemiBytes)
stats.createHOG('file_sz_hog_log' , 'file_sz', statsmod.LogBytes)

stats.createStat('time_to_stat', statsmod.Timer)
stats.createHOG('time_to_stat_hog_reg' , 'time_to_stat', statsmod.LogMS)
stats.createHOG('time_to_stat_hog_semi', 'time_to_stat', statsmod.SemiLogMS)
stats.createHOG('time_to_stat_hog_log' , 'time_to_stat', statsmod.LinLogMS)

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

