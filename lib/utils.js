
var util = require('util')
  , sprintf = require('printf')

var repeatstr = exports.repeatstr = function repeatstr(x,n) {
  var s=""
  while(n-->0) s+=x
  return s
}

var rand = exports.rand = function rand(x) {
  //var r = x*Math.random()
  //return r
  return x*Math.random()
}

var isInt = exports.isInt = function isInt(i) {
  return i%1 === 0
}

var max = exports.max = function max(a,b) { return a>b ? a : b }
var min = exports.min = function min(a,b) { return a>b ? b : a }

var cmp = exports.cmp = function cmp(a,b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

var utcisodatetime = exports.utcisodatetime = function utcisodatetime(date){
  if (typeof date === 'undefined') date = new Date()
  var str = sprintf("%4d%02d%02d%02d%02d%02d"
                   , date.getUTCFullYear()
                   , date.getUTCMonth()+1
                   , date.getUTCDate()
                   , date.getUTCHours()
                   , date.getUTCMinutes()
                   , date.getUTCSeconds())
  return str
}

var isodatetime = exports.isodatetime = function isodatetime(date){
  if (typeof date === 'undefined') date = new Date()
  var str = sprintf("%4d%02d%02d%02d%02d%02d"
                   , date.getFullYear()
                   , date.getMonth()+1
                   , date.getDate()
                   , date.getHours()
                   , date.getMinutes()
                   , date.getSeconds())
  return str
}