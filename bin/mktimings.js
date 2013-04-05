#!/usr/bin/env node

var fs = require('fs')
  , rand = require('../lib/utils').rand
  , totalMS = 61*1000

var a = []
  , t = totalMS
  , tt = 10+Math.floor(rand(90))
do {
  a.push(tt)
  tt = 10+Math.floor(rand(90))
  t -= tt
} while (t>0)

a.push(t+tt)

console.log("a = %j", a)
fs.writeFileSync('timings.json', JSON.stringify(a))

//
