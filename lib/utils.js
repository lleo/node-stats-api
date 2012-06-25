
var util = require('util')
  , format = util.format
  , log = console.log

exports.logf = function logf() { log(format.apply(this, arguments)) }

exports.repeatstr = function repeatstr(x,n) {
  var s=""
  while(n-->0) s+=x
  return s
}

//exports.rand = function rand(x) {
//  var r
//  do {
//    r = x*Math.random()
//  } while(r === x)
//  return r
//}
exports.rand = function rand(x) {
  //var r = x*Math.random()
  //return r
  return x*Math.random()
}

exports.isInt = function isInt(i) {
  return i%1 === 0
}

exports.isNaN = function isNaN(o) {
  return o !== o
}

//stolen from underscore; sorta...
//  they use '==' I prefer '===' in V8 it doesn't matter speed-wise
exports.isString = function isString(o) {
  return Object.prototype.toString.call(o) === "[object String]"
}

exports.max = function max(a,b) { return a>b ? a : b }
exports.min = function min(a,b) { return a>b ? b : a }

exports.cmp = function cmp(a,b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}