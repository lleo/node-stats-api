#!/usr/bin/env node

var fs = require('fs')
  , rand = require('../lib/utils').rand
  , totalMS = 61*1000
  , intervalMS = 100 //check in test/03-FillAllStats.js

var a = [], iters = totalMS/intervalMS, i

for (i=0; i<iters; i++) a.push( 1024 - ( 1 + Math.floor(rand(1023)) ) )

console.log("a = %j", a)

fs.writeFileSync('data.json', JSON.stringify(a))

//