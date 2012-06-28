
var u = require('underscore')
//  , EventEmitter = require('eventemitter2')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , format = util.format
  , inspect = util.inspect
  , log = console.log
  , sprintf = require('printf')
  , assert = require('assert')
  , utils = require('./utils')
  , repeatstr = utils.repeatstr
  , max = utils.max
  , cmp = utils.cmp
  , slice = Array.prototype.slice
  
var SINGLETON;
var getStats = exports.getStats = function getStats() {
  if (SINGLETON) return SINGLETON
  SINGLETON = new NameSpace()
  return SINGLETON
}

/** NameSpace class
 *
 */
var NameSpace = exports.NameSpace = function NameSpace() {
  EventEmitter.call({})
  this.stat = {}
  this.hog  = {}
  this.ns   = {}
}
util.inherits(NameSpace, EventEmitter)

NameSpace.prototype.set =
NameSpace.prototype.register = function NameSpace__register(name, thing) {
//  if (this.ns[name] !== undefined)
//    throw new Error(format("'%s' already registered", name))

  if (thing instanceof Stat) {
    assert(this.stat[name] == null, format("NameSpace already has a Stat named '%s'", name))
    this.stat[name] = thing
  }
  else if (thing instanceof Histogram) {
    assert(this.stat[name] == null, format("NameSpace already has a Histogram named '%s'", name))
    this.hog[name] = thing
  }
  else if (thing instanceof NameSpace) {
    assert(this.stat[name] == null, format("NameSpace already has a NameSpace named '%s'", name))
    this.ns[name] = thing
  }
  this.emit('registered', name, thing)

  return this
}

NameSpace.prototype.unregisterStat =
function NameSpace__unregisterStat(name) {
  var thing = this.stat[name]
  if (thing && delete this.stat[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.unregisterHog =
NameSpace.prototype.unregisterHOG =
NameSpace.prototype.unregisterHistogram =
function NameSpace__unregisterHistogram(name) {
  var thing = this.hog[name]
  if (thing && delete this.hog[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.unregisterNS =
NameSpace.prototype.unregisterNameSpace =
function NameSpace__unregisterSameSpace(name) {
  var thing = this.ns[name]
  if (thing && delete this.ns[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.getStat = 
function NameSpace__getStat(name) {
  return this.stat[name]
}

NameSpace.prototype.getHog =
NameSpace.prototype.getHOG =
NameSpace.prototype.getHistogram =
function NameSpace__getHistogram (name) {
  return this.hog[name]
}

NameSpace.prototype.getNS =
NameSpace.prototype.getNameSpace =
function NameSpace__getNameSpace(name) {
  return this.ns[name]
}

NameSpace.prototype.get =
function NameSpace__get(name) {
  var thing
  thing = this.getStat(name)
  if (thing) return thing
  thing = this.getHistogram(name)
  if (thing) return thing
  thing = thig.getNameSpace(name)
  if (thing) return thing
  
  return
}

NameSpace.prototype.createStat =
function NameSpace__createStat(name, type, opt) {
  var stat = new type(opt)

  this.set(name, stat)

  return stat
}

NameSpace.prototype.createHog =
NameSpace.prototype.createHOG =
NameSpace.prototype.createHistogram =
function NameSpace__createHistogram(name, stat, bucketerType, opt) {
  if (u.isString(stat)) {
    var statname = stat
    stat = this.getStat(statname)
    assert(stat !== undefined, format("unknown stat name '%s'", statname))
  }

  var bkter = new bucketerType(opt)
    , hog = new Histogram(stat, bkter)

  this.set(name, hog)
  
  return hog
}

NameSpace.prototype.createNameSpace =
function NameSpace__createNameSpace(name) {
  this.set(name, new NameSpace())
}

NameSpace.DEFAULT_DISPLAY_OPT = {
  orient: 'horiz'
, title : true
, indent: ""
}
NameSpace.prototype.toString = function NameSpace__toString(opt) {
  var self = this
    , stats = []
    , hogs  = []
    , nss   = []
    , str = ""
    , nopt

  opt = u.defaults(opt||{}, NameSpace.DEFAULT_DISPLAY_OPT)

  nopt = u.clone(opt)
  nopt.indent += opt.indent || "  "
  
//  Object.keys(this.ns).forEach(function(name){
//    var s = self.get(name)
//    if      (s instanceof Stat ) stats.push([name, s])
//    else if (s instanceof Histogram) hogs.push([name, s])
//    else if (s instanceof NameSpace) nss.push([name,s])
//    else    throw new Error(format("WTF %s", s))
//  })

  var self = this
  stats = Object.keys(this.stat).map(function(k){return [k,self.getStat(k)]})
  hogs  = Object.keys(this.hog ).map(function(k){return [k,self.getHog (k)]})
  nss   = Object.keys(this.ns  ).map(function(k){return [k,self.getNS  (k)]})

  var i, maxlen=0
  for (i=0; i<stats.length; i++)
    maxlen = maxlen > stats[i].length ? maxlen : stats[i].length

  var lines = []
  stats.forEach(function(e){
    var name = e[0]
      , stat = e[1]
    lines.push(opt.indent+sprintf("STAT %*s %s",name,maxlen,stat.toString()))
    //lines.push( opt.indent+sprintf("STAT %*s", name, maxlen) )
    //lines.push( opt.indent+stat.toString(nopt))
  })

  hogs.forEach(function(e){
    var name = e[0]
      , hog  = e[1]
      , s =  hog.toString(nopt)
      
    //s = s.replace(/^/mg, "  ")
    s = s.replace(/^/mg, opt.indent)

    lines.push( opt.indent+"HOG "+name )
    lines.push( s )
  })

  nss.forEach(function(e){
    var name = e[0]
      , ns   = e[1]

    lines.push( opt.indent+"NS "+name )
    lines.push( ns.toString(nopt) )
  })
  
  str += lines.join('\n')
  return str
}

/** Stat class
 * stupid nothing class for ISA purposes
 *
 */
var Stat = exports.Stat = function Stat() {
  EventEmitter.call(this)
}
util.inherits(Stat, EventEmitter)

Stat.prototype.publish = function Stat__publish(err, value) {
  if (err)
    this.emit('error', err, value)
  else
    this.emit('value', value)

  return value
}

/** Value Stat class
 *
 */
var Value = exports.Value = function Value(opt) {
  Stat.call(this)
  this.value = undefined
  this.units = opt && opt.units || ""
}
util.inherits(Value, Stat)

Value.prototype.set = function Value__set(v) {
  this.value = v
  return this.publish(null, this.value)
}

Value.prototype.toString = function Value__toString() {
  var str = this.value+""
  if (this.units) str += " "+this.units
  return str
}

/** Timer Stat class
 *
 */
var Timer = exports.Timer = function Timer() {
  Stat.call(this)
  this.value = undefined
  this.units = "ms"
}
util.inherits(Timer, Stat)

Timer.prototype.start = function Timer__start() {
  var self = this
    , t0 = Date.now()

  return function(err) {
    self.value = Date.now() - t0 //last value
    self.publish(err, self.value)
  }
}

Timer.prototype.toString = function Timer__toString() {
  var str = this.value + " " + this.units
  return str
}

/** Count Stat class
  *
  */
var Count = exports.Count = function Count(opt) {
  assert(opt, "options object argument is required")
  assert(opt.units, "'units' is a required option")
  //assert(opt.stat, "'stat' is a required option")

  Stat.call(this, opt)

  this.stat = opt.stat
  this.count = 0
  this.units = opt && opt.units || ""

  if (this.stat) {
    var self = this
    this.stat.on('value', function(d) { self.incr() })
  }
}
util.inherits(Count, Stat)

Count.prototype.inc = function Count__inc(i){
  if (arguments.length === 0 || i === undefined) i=1
  var ocount = this.count
  this.count += i

  if (ocount === this.count) {
    //Why? Here's a clue Math.pow(2,53) === Math.pow(2,53)+1
    this.reset()
  }

  this.publish(null, i)//no publish ?
}

Count.prototype.reset = function(){
  var ocount = this.count
  this.count = 0
  this.emit('reset', ocount)
  return ocount
}

Count.prototype.value = function(){ return this.count }

Count.prototype.toString = function Count__toString() {
  var s = ""
  s += this.count+""
  if (this.units) s += " "+this.units
  return s
}

/** Rate Stat class
  *
  */
var Rate = exports.Rate = function Rate(opt) {
  assert(opt, "options object argument is required")
  assert(opt.hasOwnProperty('units'), "'units' is a required option")
  assert(opt.hasOwnProperty('stat'), "'stat' is a required option")
  assert(opt.stat instanceof Stat, "'stat' must be of type Stat")
//  log("opt=%j", opt)

  Stat.call(this)

  this.stat = opt.stat
  this.rate = undefined
  this.value = 0
  this.units = opt.units
  this.period = opt && opt.period || 60
  this.interval = opt && opt.interval || 1000

  var self = this
  this.stat.on('value', function(v){
    //log("Rate onValue: v=%d", v)
    self.add(v)
  })

  var t = this.period * this.interval
  log("this.period=%d; this.interval=%d, t=%d", this.period, this.interval, t)

  this.intervalid = setInterval(function(){
    //var rate = self.value / self.period
    self.rate = self.value / self.period
    //log("setInterval: value=%d; rate=%d; period=%d; interval=%d",
    //    self.value, self.rate, self.period, self.interval)
    self.emit('value', this.rate)
    self.reset()
  }, t)
}
util.inherits(Rate, Stat)

Rate.prototype.add = function Rate__add(v){
  //log("Rate__add: value=%d; v=%d;", this.value, v)
  this.value += v
}

Rate.prototype.reset = function Rate__reset(){
  var ovalue = this.value
  this.value = 0
  this.emit('reset', ovalue)
  return ovalue
}

Rate.prototype.toString = function Rate__toString() {
  var s = ""
  s += this.rate+""
  if (this.units) s += " "+this.units
  return s
}

/** MovingAverage Stat class
 *
 */
var MovingAverage = exports.MovingAverage =
function MovingAverage(opt) {
  assert(opt, "options object argument is required")
  Stat.call(this)

  assert(opt.hasOwnProperty('stat'), "require option 'stat' missing")
  assert(opt.stat instanceof Stat, "given stat is not of type Stat")
  this.stat = opt.stat

  this.value = undefined
  this.nelts = opt.nelts || 10
  this.values = []
  this.mavg = 0
  
  var self = this
  this.consume_cb = function(v) { self.add(v) }
  this.stat.on('value', this.consume_cb)
}
util.inherits(MovingAverage, Stat)

MovingAverage.prototype.add = function MovingAverage__add(value) {

  if (this.values.length < this.nelts) {
    //haven't filled this.values
    // so we calculate based on a full sum
    this.values.push(value)
    var i, sum = 0
    for (i=0; i<this.values.length; i++) { sum += this.values[i] }
    this.mavg = sum / this.values.length
  }
  else {
    //this.mavg = this.mavg - (this.values[0]/this.nelts) + (value/this.nelts)

    var oldest = this.values[0]
      , newest = value

    //this.mavg -= this.values[0]/this.nelts
    //this.mavg += value/this.nelts
    this.mavg -= oldest/this.nelts
    this.mavg += newest/this.nelts
    
    this.values.shift()
    this.values.push(value)
  }

  return this.publish(null, this.mavg)
}

MovingAverage.prototype.destroy = function MovingAverage__destroy() {
  if (this.stat)
    this.stat.removeListener('value', this.consume_cb)
}

MovingAverage.prototype.toString = function MovingAverage__toString() {
  var str = this.mavg+""
  return str
}

/** RunningAverage Stat class
 *
 */
var RunningAverage = exports.RunningAverage =
function RunningAverage(opt) {
  Stat.call(this)

  assert(opt.hasOwnProperty('stat'), "require option 'stat' missing")
  assert(opt.stat instanceof Stat, "given stat is not of type Stat")
  this.stat = opt.stat

  this.ravg = undefined
  this.nelts = opt && opt.nelts || 10

  var self = this
  this.consume_cb = function(v) { self.add(v) }
  this.stat.on('value', this.consume_cb)
}
util.inherits(RunningAverage, Stat)

RunningAverage.prototype.add = function RunningAverage__add(value) {
  if (this.ravg === undefined)
    this.ravg = value
  else
    this.ravg = (this.ravg*(this.nelts-1) + value)/this.nelts

  return this.publish(null, this.ravg)
}

RunningAverage.prototype.destroy = function RunningAverage__destroy() {
  if (this.stat)
    this.stat.removeListener('value', this.consume_cb)
}

RunningAverage.prototype.toString = function RunningAverage__toString() {
  var str = this.ravg+""
  return str
}

/** Histogram class
 *
 */
var HOG, Histogram = HOG = exports.Histogram = exports.HOG =
function Histogram(stat, bucketer) {
//  assert(opt, "options object argument is required")
  EventEmitter.call(this)

  this.total = 0
  this.hog = {}
  this.bucketer = bucketer
  this.stat = stat

  var self = this
  this.ev_listener = function(v){ self.add(v) }

  this.stat.on('value', this.ev_listener)
}
util.inherits(Histogram, EventEmitter)

Histogram.prototype.destroy = function Histogram__destroy() {
  this.stat.removeListener('value', this.ev_listner)
  delete this.stat
}

Histogram.prototype.add = function Histogram__add(v) {
  this.total += 1
  var bkt = this.bucketer.bucket(v)
//  log("Histogram__add: %d -> %s", v, bkt)
  if (this.hog[bkt] === undefined) this.hog[bkt] = 0
  this.hog[bkt] += 1
}

Histogram.DEFAULT_DISPLAY_OPT = {
  indent  : ""
, orient  : "horizontal"  //or "vertical"
, values  : "percentage"  //or "absolute" or "both"
, hash    : false         //or true; true overrides orient
}
Histogram.prototype.toString = function Histogram__toString(opt) {
  var b = this.bucketer
    , str = ""

  opt = u.defaults(opt||{}, Histogram.DEFAULT_DISPLAY_OPT)

  //log("opt = %j", opt)

  var self = this, val_maxlen=0, pct_maxlen=0, nam_maxlen=0
  var buckets = Object.keys(this.hog).map(function(bkt_name){
    var v = self.hog[bkt_name]
      , pct = Math.floor( (v/self.total)*100 )
    
    val_maxlen = max(v.toString().length, val_maxlen)
    pct_maxlen = max(pct.toString().length, pct_maxlen)
    nam_maxlen = max(bkt_name.length, nam_maxlen)
    return { value  : v
           , pct    : pct
           , name   : bkt_name
           , order  : b.order(bkt_name) }
  }).sort(function(a,b) { return cmp(a.order, b.order) })
  
  var lines = []
  
  if (buckets.length > 0) {
    var show_pct = opt.values === "percentage" || opt.values === "both"
      , show_val = opt.values === "absolute"   || opt.values === "both"

    if (opt.hash) opt.orient = "vertical"
    
    if (opt.orient === "vertical") {
      buckets.forEach(function(bkt){
        var line = opt.indent
        line += sprintf("%*s ", bkt.name, nam_maxlen)
        if (show_pct) line += sprintf("%%%-*s", bkt.pct, pct_maxlen+1)
        if (opt.values === "both") line += "/"
        if (show_val) line += sprintf("%-*s",  bkt.value, val_maxlen)
        if (opt.hash) line += ": "+repeatstr('#', bkt.pct)
        lines.push( line )
      })
    }
    else {
      //str += format("raw buckets = %j", buckets)
      var vcol=[], tcol=[]
      buckets.map(function(bkt){
        var col = {}
    
        if (show_pct) col.value = "%"+bkt.pct
        if (opt.values === "both") col.value += "/"
        if (show_val) col.value += bkt.value.toString()
    
        col.title = bkt.name
        
        col.width = max(col.value.length, col.title.length)
        
        return col
      }).forEach(function(col){
        vcol.push( sprintf("%*s", col.value, col.width) )
        tcol.push( sprintf("%*s", col.title, col.width) )
      })
      var vline = opt.indent+vcol.join(" ")
        , tline = opt.indent+tcol.join(" ")
      lines.push( vline )
      lines.push( tline )
    }
  }
  else
    lines.push("empty")
  
  str += lines.join("\n")
  return str
}

/** Histogram Bucketer functions
 *
 */

/** pseudo_floor()
 *  Math.log(1000)/Math.LN10 = 2.9999999999999996 oops!
 *  for b=2.9999999999999996
 *    Math.abs(Math.round(b)-b) < Math.pow(10,-15) => true
 *  Math.pow(10,-15) works for log10(10^3) log10(10^6) but not log10(10^9)
 *  Math.pow(10,-14) works all the way upto log(10^15) [all 32bit ints]
 *  Math.pow(2,-48) works and seems more precice [~3.55x10^-15 approx 10^-14]
 *  To work all the way up to Number.MAX_VALUE we need Math.pow(2,-43)
 *
 *  NOTE: I am sure there is a proper double floating point logic to
 *        solve this but FUCK IT.
 */
function pseudo_floor(v) {
  if (v < 0) return Math.floor(v)
  //if (Math.abs(Math.round(v)-v) < 0.000000000000001) //Math.pow(10,-14)
  if (Math.abs(Math.round(v)-v) < Math.pow(2,-43))
    return Math.round(v);
  return Math.floor(v)
}
function log10(v) { return Math.log(v)/Math.LN10 }
function order10(v) { return pseudo_floor( log10(v) ) }
//function multiple10(v) { return Math.pow(10, order10(v)) }
//function N10(v)     { return Math.floor( v / mult(v) ) }

var Bucketer = exports.Bucketer = function Bucketer(){}

var Linear = exports.Linear = function Linear(opt) {
  Bucketer.call(this)
  this.base  = opt && opt.base  || 1
  this.units = opt && opt.units || ""
}
util.inherits(Linear, Bucketer)

Linear.prototype.order = function Linear__order(bucket) {
  var i = parseInt(bucket, 10)
  return i
}

Linear.prototype.bucket = function Linear__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var i = Math.floor(v/this.base), rv

  rv = i+" "+this.units

  return rv
}


var LogMS = exports.LogMS =
function LogMS() {
  Bucketer.call(this)
}
util.inherits(LogMS, Bucketer)

LogMS.ORDER = {
  'ms'        : 0
, '10 ms'     : 1
, '10^2 ms'   : 2
, '1 sec'     : 3
, '10 sec'    : 4
, '10^2 sec'  : 5
, '10^3 sec'  : 6
, '10^4 sec'  : 7
, '10^5 sec'  : 8
, '10^6 sec'  : 9
, 'lot-o-sec' : 10
}

LogMS.prototype.order =
function LogMS__order(bucket) {
  var order = LogMS.ORDER[bucket]
  return order
}

LogMS.prototype.bucket =
function LogMS__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var order

  if (v < 1)
    order = 0
  else
    order = order10(v)

  switch (order) {
    case 0:
      return "ms"
    case 1:
      return "10 ms"
    case 2:
      return "10^2 ms"
    case 3:
      return "seconds"
    case 4:
      return "10 sec"
    case 5:
      return "10^2 sec"
    case 6:
      return "10^3 sec"
    case 7:
      return "10^4 sec"
    case 8:
      return "10^5 sec"
    case 9: //log10(Math.pow(2,32)) => 9.632959861247397
      return "10^6 sec"
    default:
      return "lot-o-sec"
  }
}

var SemiLogMS = exports.SemiLogMS =
function SemiLogMS() {
  LogMS.call(this)
}
util.inherits(SemiLogMS, LogMS)

var semims = [], semims_re = [], semims_sep=" "
semims[0] = "0-2" ; semims_re[0] = "0-2"
semims[1] = "2-5" ; semims_re[1] = "2-5"
semims[2] = "5-10"; semims_re[2] = "5-10"

var semims_re = sprintf("^((?:%s)|(?:%s)|(?:%s))%s(.*)$",
                 semims_re[0], semims_re[1], semims_re[2], semims_sep)
  , semims_rx = new RegExp(semims_re)

SemiLogMS.prototype.order =
function SemiLogMS__order(bucket) {
  var m = semims_rx.exec(bucket)
  //assert.notStrictEqual(m, null)
  if (m === null) {
    throw new Error(format("SemiLogMS__order: regex failed. bucket='%s' re=/%s/", bucket, re))
  }

  var pre = m[1]
    , bkt = m[2]
    , f, order = LogMS.prototype.order(bkt)

  switch (pre) {
    case semims[0]: f=0; break;
    case semims[1]: f=0.2; break;
    case semims[2]: f=0.5; break
    default: throw new Error("should not happen")
  }

  return order+f
}

SemiLogMS.prototype.bucket =
function SemiLogMS__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var order, fract, pre, rv

  if (v < 1)
    fract = 0
  else {
    order = order10(v)
    fract = v / Math.pow(10,order)
  }


  if (fract >= 0 && fract < 2) {
    //pre = "0,<2"
    pre = semims[0]
  }
  else if (fract >= 2 && fract < 5) {
    //pre = "2,<5"
    pre = semims[1]
  }
  else if (fract >= 5 && fract < 10) {
    //pre = "5,<10"
    pre = semims[2]
  }
  else throw Error(format("should not happen; v=%s; fract=%s;", v, fract))

  var logbkt = LogMS.prototype.bucket(v)

  //rv = format("%s %s", pre, logbkt)
  rv = pre + semims_sep + logbkt

  return rv
}

var LinLogMS = exports.LinLogMS =
function LinLogMS() {
  LogMS.call(this)
}
util.inherits(LinLogMS, LogMS)

LinLogMS.prototype.order =
function LinLogMS__order(bucket) {
  var match = /^(\d+) (.*)$/.exec(bucket)
  var n = parseInt(match[1], 10)
    , order = LogMS.prototype.order(match[2])
    , rv = n + Math.pow(10,order)
  return rv
}

LinLogMS.prototype.bucket =
function LinLogMS__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var order, mult, n, rv

  if (v < 1)
    order = 0
  else
    order = order10(v)

  mult = Math.pow(10,order)
  n = Math.floor(v/mult)

  rv = sprintf("%d %s", n, LogMS.prototype.bucket(v))

  return rv
}



function log2(v) { return Math.log(v)/Math.LN2 }
function order2(v) { return Math.floor(log2(v)) }
function in_range(v, lo, hi) { // lo <= v < hi
  return lo<=v ? v<hi ? true : false : false
//  if (lo <= v) {
//    if (v < hi) return true
//    else return false
//  }
//  else return false
}

var Bytes = exports.Bytes = function Bytes() {
  Bucketer.call(this)
}
util.inherits(Bytes, Bucketer)

Bytes.ORDER = {
  "bytes": 0
, "KB": 10
, "MB": 20
, "GB": 30
, "TB": 40
, "PB": 50
, "EB": 60
, "YB": 70
, "lots-o-bytes": 80
}
Bytes.prototype.order =
function Bytes__order(bucket) {
  return Bytes.ORDER[bucket]
}

Bytes.prototype.bucket =
function Bytes__bucket(v) {
  assert(v >= 0, "value is less than zero")
  
  var order

  if (v < 1)
    order = 0
  else
    order = order2(v)

  // 0  <= order < 10 "bytes"
  if (in_range(order,  0, 10)) return "bytes"
  // 10 <= order < 20 "KB"
  if (in_range(order, 10, 20)) return "KB"
  // 20 <= order < 30 "MB"
  if (in_range(order, 20, 30)) return "MB"
  // 30 <= order < 40 "GB"
  if (in_range(order, 30, 40)) return "GB"
  // 40 <= order < 50 "TB"
  if (in_range(order, 40, 50)) return "TB"
  // 50 <= order < 60 "PB"
  if (in_range(order, 50, 60)) return "PB"
  // 60 <= order < 70 "EB"
  if (in_range(order, 60, 70)) return "EB"
  // 70 <= order < 80 "YB"
  if (in_range(order, 70, 80)) return "YB"
  // 80 <= order "lots-o-bytes"
  return "lots-o-bytes"
}

var SemiBytes = exports.SemiBytes = function SemiBytes() {
  Bytes.call(this)
}
util.inherits(SemiBytes, Bytes)

var semibyt = [], semibyt_re = []
semibyt[0] = "0-64"    ; semibyt_re[0] = "0-64"
semibyt[1] = "64-192"  ; semibyt_re[1] = "64-192"
semibyt[2] = "192-448" ; semibyt_re[2] = "192-448"
semibyt[3] = "448-1024"; semibyt_re[3] = "448-1024"

var semibyt_re = sprintf("^((?:%s)|(?:%s)|(?:%s)|(?:%s)) (.*)$",
                          semibyt_re[0], semibyt_re[1], semibyt_re[2],
                          semibyt_re[3])
  , semibyt_rx = new RegExp(semibyt_re)

SemiBytes.prototype.order =
function SemiBytes__order(bucket) {
  var m = semibyt_rx.exec(bucket)
  if (m === null) {
    throw new Error(format("SemiLogMS__order: regex failed. bucket='%s' re=/%s/", bucket, re))
  }

  var pre = m[1]
    , bkt = m[2]
    , f, order = Bytes.prototype.order(bkt)

  switch (pre) {
    case semibyt[0]: f=0.0; break;
    case semibyt[1]: f=0.2; break;
    case semibyt[2]: f=0.4; break
    case semibyt[3]: f=0.6; break
    default: throw new Error("should not happen")
  }

  return order+f
}

SemiBytes.prototype.bucket =
function SemiBytes__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var byt = Bytes.prototype.bucket(v)

  var fract, order, base

  if (v < 1)
    fract = 0
  else {
    //find the order2 to the lowest factor of 10
    order = order2(v)
    base = Math.floor(order/10)*10
    fract = v/Math.pow(2,base) //range 0 >= x < 2^10
  }


  //64w  [0,64)
  //128w [64,192)
  //256w [192, 448)
  //576w [448,1024)
  if (fract>=0   && fract<64  ) return format("%s %s", semibyt[0], byt)
  if (fract>=64  && fract<192 ) return format("%s %s", semibyt[1], byt)
  if (fract>=192 && fract<448 ) return format("%s %s", semibyt[2], byt)
  if (fract>=448 && fract<1024) return format("%s %s", semibyt[3], byt)
  throw new Error(format("fract = %d", fract))
}

var LogBytes = exports.LogBytes = function LogBytes() {
  Bytes.call(this)
}
util.inherits(LogBytes, Bytes)

LogBytes.prototype.order =
function LogBytes__order(bucket) {
  var n, order, rv
    , match = /^(\d+)-(\d+) (.*)$/.exec(bucket)

  n = parseInt(match[1], 10)
  order = Bytes.prototype.order(match[3])
  rv = n + Math.pow(2,order)

  //log("LogBytes__order(%s) => %d", bucket, rv)
  return rv
}

LogBytes.prototype.bucket =
function LogBytes__bucket(v) {
  assert(v >= 0, "value is less than zero")

  var byt = Bytes.prototype.bucket(v)

  var order, base, sgnf, lorder, x, y

  if (v < 1)
    lorder = 0
  else {
    order = order2(v)
    base = Math.floor(order/10)*10
    sgnf = Math.floor(v/Math.pow(2,base)) //range 0 >= x < 2^10
    lorder = Math.floor(log2(sgnf))
  }

  x = lorder === 0 ? 0 : Math.pow(2, lorder)
  y = Math.pow(2, lorder+1)


  //log("v=%d; order=%s; base=%s; sgnf=%s; byt=%s; lorder=%s; x=%s; y=%s;",
  //    v, order, base, sgnf, byt, lorder, x, y)

  var s = format("%d-%d %s", x, y, byt)
//  log("LogBytes__bucket: return '%s'", s)
  return s
}
