
var util = require('util')

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
