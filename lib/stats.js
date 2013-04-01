
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


function log10(v) {
  var r = Math.log(v)/Math.LN10
  if (v%10==0 && r%1!=0) return Math.round(r)
  return r
}
function order10(v) { return Math.floor( log10(v) ) }
function log2(v) {
  var r = Math.log(v)/Math.LN2
  if (v%2==0 && r%1!=0) return Math.round(r)
  return r
}
function order2(v) { return Math.floor(log2(v)) }
function in_range(v, lo, hi) { // lo <= v < hi
  return lo<=v ? v<hi ? true : false : false
//  if (lo <= v) {
//    if (v < hi) return true
//    else return false
//  }
//  else return false
}

var SINGLETON;

var Stats = exports = module.exports = function Stats(){
  if (SINGLETON) return SINGLETON
  SINGLETON = new NameSpace()
  return SINGLETON
}

Stats.getStats = function getStats(){
  return Stats()
}

/** NameSpace class
 *
 */
var NameSpace = Stats.NameSpace = function NameSpace(){
  EventEmitter.call(this)
  this.stat = {}
  this.hog  = {}
  this.ns   = {}
}
util.inherits(NameSpace, EventEmitter)

NameSpace.prototype.set = NameSpace.prototype.register =
function register(name, thing){
//  if (this.ns[name] !== undefined)
//    throw new Error(format("'%s' already registered", name))

  if (thing instanceof Stat) {
    assert(this.stat[name] == null, format("NameSpace already has a Stat named '%s'", name))
    this.stat[name] = thing
  }
  else if (thing instanceof Histogram) {
    assert(this.hog[name] == null, format("NameSpace already has a Histogram named '%s'", name))
    this.hog[name] = thing
  }
  else if (thing instanceof NameSpace) {
    assert(this.ns[name] == null, format("NameSpace already has a NameSpace named '%s'", name))
    this.ns[name] = thing
  }
  this.emit('registered', name, thing)

  return this
}

NameSpace.prototype.unregisterStat = function unregisterStat(name){
  var thing = this.stat[name]
  if (thing && delete this.stat[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.unregisterHog =
NameSpace.prototype.unregisterHOG =
NameSpace.prototype.unregisterHistogram = function unregisterHistogram(name){
  var thing = this.hog[name]
  if (thing && delete this.hog[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.unregisterNS =
NameSpace.prototype.unregisterNameSpace = function unregisterNameSpace(name){
  var thing = this.ns[name]
  if (thing && delete this.ns[name]) {
    this.emit('unregistered', name, thing)
  }
  return thing
}

NameSpace.prototype.getStat = function getStat(name){
  return this.stat[name]
}

NameSpace.prototype.getHog =
NameSpace.prototype.getHOG =
NameSpace.prototype.getHistogram = function getHistogram(name){
  return this.hog[name]
}

NameSpace.prototype.getNS =
NameSpace.prototype.getNameSpace = function getNameSpace(name){
  return this.ns[name]
}

NameSpace.prototype.get = function get(name){
  var thing
  thing = this.getStat(name)
  if (thing) return thing
  thing = this.getHistogram(name)
  if (thing) return thing
  thing = this.getNameSpace(name)
  if (thing) return thing

  return
}

NameSpace.prototype.createStat = function createStat(name, type, opt){
  var stat = new type(opt)

  this.set(name, stat)

  return stat
}

NameSpace.prototype.createHog =
NameSpace.prototype.createHOG =
NameSpace.prototype.createHistogram =
function createHistogram(name, stat, bucketer, opt){
  if (u.isString(stat)) {
    var statname = stat
    stat = this.getStat(statname)
    assert(stat !== undefined, format("unknown stat name '%s'", statname))
  }

  var hog = new Histogram(stat, bucketer)

  this.set(name, hog)

  return hog
}

NameSpace.prototype.createNameSpace = function createNameSpace(name){
  this.set(name, new NameSpace())
}

NameSpace.DEFAULT_DISPLAY_OPT = {
  orient: 'horiz'
, title : true
, indent: ""
}
NameSpace.prototype.toString = function toString(opt){
  var self = this
    , stats = []
    , hogs  = []
    , nss   = []
    , str = ""
    , nopt

  opt = u.defaults(opt||{}, NameSpace.DEFAULT_DISPLAY_OPT)

  nopt = u.clone(opt)
  nopt.indent += opt.indent || "  "

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

/**
 * Stat Base Class
 * @constructor
 */
var Stat = Stats.Stat = function Stat(){
  EventEmitter.call(this)
}
util.inherits(Stat, EventEmitter)

Stat.prototype.publish = function publish(err, value){
  if (err)
    this.emit('error', err, value)
  else
    this.emit('value', value)

  return value
}

/**
 * Value Stat class
 * @constructor
 * @param {object} opt
 */
var Value = Stats.Value = function Value(opt){
  Stat.call(this)
  this._value = undefined
  this._units = opt && opt.units || ""
}
util.inherits(Value, Stat)

Value.prototype.set = function set(v) {
  this._value = v
  return this.publish(null, this.value)
}

Value.prototype.value = function value(v){
  return this._value
}

Value.prototype.units = function units(v){
  return this._units
}

Value.prototype.toString = function toString(){
  var str = this.value()+""
  if (this.units()) str += " "+this.units()
  return str
}


/**
 * TimerMS Stat Class
 * @constructor
 */
var TimerMS = Stats.TimerMS = function TimerMS(){
  Value.call(this, {units: "ms"})
}
util.inherits(TimerMS, Value)

TimerMS.prototype.start = function start(){
  var self = this
    , t0 = Date.now()
    //, t0 = process.hrtime()

  return function(err) {
    self.set( Date.now() - t0 ) // cur value - last value
    //var diff = process.hrtime(t0)
    //self.value = diff[0] * 1e9 + diff[1]
    //self.publish(err, self.value)
  }
}


/**
 * TimerNS Stat Class
 * @constructor
 */
var TimerNS = Stats.TimerNS = function TimerNS() {
  Value.call(this, {units: "ns"})
}
util.inherits(TimerNS, Value)

TimerNS.prototype.start = function start(){
  var self = this
    , t0 = process.hrtime()

  return function(err) {
    var diff = process.hrtime(t0)
    self.set( diff[0] * 1e9 + diff[1] )
    //self.value = diff[0] * 1e9 + diff[1]
    //self.publish(err, self.value)
  }
}

/**
 * Count Stat Class
 * @constructor
 * @param {object} opt
 */
var Count = Stats.Count = function Count(opt){
  assert(opt, "options object argument is required")
  assert(opt.units, "'units' is a required option")
  //assert(opt.stat, "'stat' is a required option")

  Value.call(this, opt)

  this._value = 0 //not undefined which is the default from Value.call() above
  this.stat = opt.stat

  if (this.stat) {
    var self = this
    this.stat.on('value', function(d) { self.incr() })
  }
}
util.inherits(Count, Value)

Count.prototype.inc = function inc(i){
  if (arguments.length === 0 || i === undefined) i=1
  var ovalue = this.value()
  //this.value += i

  //if (ovalue === this.value) {
  if (ovalue === this.value()+1) {
    //Why? Here's a clue Math.pow(2,53) === Math.pow(2,53)+1
    this.reset()
  }

  this.set(this.value()+1)
  //this.publish(null, i) //no publish ? publish this.value? or publish i?
}

Count.prototype.reset = function reset(){
  var ovalue = this.value()
  this.set(0)
  this.emit('reset', ovalue)
  return ovalue
}

Count.prototype.value = function value(){ return this.value }


/**
 * Rate Stat class
 * @constructor
 * @param {object} opt
 *
 */
var Rate = Stats.Rate = function Rate(opt){
  assert(opt, "options object argument is required")
  //assert(opt.hasOwnProperty('units'), "'units' is a required option")
  assert(opt.hasOwnProperty('stat'), "'stat' is a required option")
  assert(opt.stat instanceof Stat, "'stat' must be of type Stat")
//  log("opt=%j", opt)

  Value.call(this, opt)

  this.acc = 0 //default is undefined; that is not good for Rate

  this.stat = opt.stat
  this.period = opt && opt.period || 60       //60 seconds aka a minute
  this.interval = opt && opt.interval || 1000 //ms => sec
  switch( this.interval*this.period ) {
    case 1000    : this.units = this.stat.units+"/sec"; break
    case 60000   : this.units = this.stat.units+"/min"; break
    case 3600000 : this.units = this.stat.units+"/hour"; break
    case 84000000: this.units = this.stat.units+"/day"; break
    default      : this.units = opt.units+""
  }

  var self = this
  this.stat.on('value', function(v){
    //log("Rate onValue: v=%d", v)
    self.add(v)
  })

  var t = this.period * this.interval
  log("this.period=%d; this.interval=%d, t=%d", this.period, this.interval, t)

  this.intervalid = setInterval(function rateintvl(){
    //var rate = self.value / self.period
    self.set( self.acc / self.period )
    //log("setInterval: value=%d; rate=%d; period=%d; interval=%d",
    //    self.value, self.rate, self.period, self.interval)
    //self.emit('value', this.rate)
    self.reset()
  }, t)

  //do not let this nodejs Timer keep the eventloop from exiting
  this.intervaleid.unref()
}
util.inherits(Rate, Value)

Rate.prototype.add = function add(v){
  //log("Rate__add: value=%d; v=%d;", this.value, v)
  //this.value += v
  this.acc += v
}

Rate.prototype.reset = function reset(){
  var ovalue = this.acc
  this.acc = 0
  this.emit('reset', ovalue)
  return ovalue
}


/** MovingAverage Stat class
 *
 */
var MovingAverage = Stats.MovingAverage = function MovingAverage(opt){
  var self = this
  assert(opt, "options object argument is required")
  Value.call(this, opt)

  this.value = 0 //default is undefined; not good for MovingAverage

  assert(opt.hasOwnProperty('stat'), "require option 'stat' missing")
  assert(opt.stat instanceof Stat, "given stat is not of type Stat")
  this.stat = opt.stat

  this.nelts = opt.nelts || 10
  this.values = []

  this.consume_cb = function consume_cb(v) { self.add(v) }
  this.stat.on('value', this.consume_cb)
}
util.inherits(MovingAverage, Value)

MovingAverage.prototype.add = function add(value) {
  var nvalue = this.value

  if (this.values.length < this.nelts) {
    //haven't filled this.values
    // so we calculate based on a full sum
    this.values.push(value)
    var i, sum = 0
    for (i=0; i<this.values.length; i++) { sum += this.values[i] }
    nvalue = sum / this.values.length
  }
  else {
    //this.value = this.value - (this.values[0]/this.nelts) + (value/this.nelts)

    var oldest = this.values[0]
      , newest = value

    //nvalue -= this.values[0]/this.nelts
    //nvalue += value/this.nelts
    nvalue -= oldest/this.nelts
    nvalue += newest/this.nelts

    this.values.shift()
    this.values.push(value)
  }

  return this.set(nvalue)
  //return this.publish(null, this.value)
}

MovingAverage.prototype.destroy = function destroy(){
  if (this.stat)
    this.stat.removeListener('value', this.consume_cb)
}


/** RunningAverage Stat class
 *
 */
var RunningAverage = Stats.RunningAverage = function RunningAverage(opt){
  var self = this
  assert(opt, "options object argument is required")
  Value.call(this, opt)

  //this.value = undefined //MUST start undefined

  assert(opt.hasOwnProperty('stat'), "require option 'stat' missing")
  assert(opt.stat instanceof Stat, "given stat is not of type Stat")
  this.stat = opt.stat

  this.nelts = opt && opt.nelts || 10

  this.consume_cb = function consume_cb(v) { self.add(v) }
  this.stat.on('value', this.consume_cb)
}
util.inherits(RunningAverage, Stat)

RunningAverage.prototype.add = function add(value){
  if (this.value === undefined)
    //this.value = value
    this.set(value)
  else
    //this.value = (this.value*(this.nelts-1) + value)/this.nelts
    this.set((this.value*(this.nelts-1) + value)/this.nelts)

  //return this.publish(null, this.value)
  return this.value()
}

RunningAverage.prototype.destroy = function destroy(){
  if (this.stat)
    this.stat.removeListener('value', this.consume_cb)
}


/**
 * Histogram Class
 * @constructor
 * @param {Stat} stat cuz a Stat obj emits 'value' events
 * @param {Bucketer} bucketer we accumulate data in buckets
 */
var HOG, Histogram = HOG = Stats.Histogram = Stats.HOG =
function(stat, bucketer){
//  assert(opt, "options object argument is required")
  EventEmitter.call(this)

  this.total = 0
  this.hog = {}
  this.bucketer = bucketer
  this.stat = stat

  var self = this
  this.ev_listener = function ev_listener(v){ self.add(v) }

  this.stat.on('value', this.ev_listener)
}
util.inherits(Histogram, EventEmitter)

Histogram.prototype.destroy = function destroy(){
  this.stat.removeListener('value', this.ev_listner)
  delete this.stat
}

Histogram.prototype.add = function add(v){
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
Histogram.prototype.toString = function toString(opt){
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

/**
 *  Histogram Bucketer class
 *
 */


var Bucketer = Stats.Bucketer = function Bucketer(orderFn, bucketFn){
  this.order = orderFn
  this.bucket = bucketFn
}

var LinearBucketer = Stats.Linear = function Linear(base, units) {
  Bucketer.call(this, linearOrder, linearBucket)
  this.base  = base  || 1
  this.units = units || ""
}
util.inherits(LinearBucketer, Bucketer)

function linearOrder(bucket) {
  var i = parseInt(bucket, 10)
  return i
}

function linearBucket(v) {
  assert(v >= 0, "value is less than zero")

  var i = Math.floor(v/this.base), rv

  rv = i+" "+this.units

  return rv
}

var LinearMS = new LinearBucketer(10, 'ms')
var LinearNS = new LinearBucketer(10, 'ns')
var LinearBytes = new LinearBucketer(10, 'bytes')

function objIdx(arr) {
  var obj = {}
  arr.forEach(function(e, i){ obj[e] = i })
  return obj
}

var logMS = Stats.logMS = new Bucketer(logMSOrder, logMSBucket)

var logMSBuckets = [
  'ms'
, '10 ms'
, '100 ms'
, 'sec'
, '10 sec'
, '100 sec'
, '10^3 sec'
, '10^4 sec'
, '10^5 sec'
, '10^6 sec'
, 'lot-o-sec'
]
var logMSOrders = objIdx(logMSBuckets)

function logMSOrder(bucket) {
  var order = logMSOrders[bucket]
  return order
}

function logMSBucket(v) {
  assert(v >= 0, "value is less than zero")

  var order

  if (v < 1)
    order = 0
  else
    order = order10(v)

  if (order > logMSBuckets.length-1)
    return logMSBuckets[logMSBuckets.length-1]

  return logMSBuckets[order]
}


var semiLogMS = Stats.semiLogMS = new Bucketer(semiLogMSOrder, semiLogMSBucket)

var semims = [], semims_re = [], semims_sep=" "
semims[0] = "1-2" ; semims_re[0] = "1-2"
semims[1] = "2-5" ; semims_re[1] = "2-5"
semims[2] = "5-10"; semims_re[2] = "5-10"

var semims_reStr = sprintf("^((?:%s)|(?:%s)|(?:%s))%s(.*)$",
                           semims_re[0], semims_re[1], semims_re[2], semims_sep)
  , semims_rx = new RegExp(semims_reStr)

function semiLogMSOrder(bucket) {
  var m = semims_rx.exec(bucket)
  //assert.notStrictEqual(m, null)
  if (m === null) {
    throw new Error(format("semiLogMSOrder: regex failed. bucket='%s' re=/%s/", bucket, re))
  }

  var pre = m[1]
    , bkt = m[2]
    , f, order = logMSOrder(bkt)

  switch (pre) {
    case semims[0]: f=0; break;
    case semims[1]: f=0.2; break;
    case semims[2]: f=0.5; break;
    default: throw new Error("should not happen")
  }

  //log("semiLogMSOrder: bkt=%s; order=%d;", bucket, order+f)

  return order+f
}

function semiLogMSBucket(v) {
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

  var logbkt = logMSBucket(v)

  //rv = format("%s %s", pre, logbkt)
  rv = pre + semims_sep + logbkt

  return rv
}

var linLogMS = Stats.linLogMS = new Bucketer(linLogMSOrder, linLogMSBucket)

function linLogMSOrder(bucket) {
  var match = /^(\d+) (.*)$/.exec(bucket)
  var n = parseInt(match[1], 10)
    , order = logMSOrder(match[2])
    , rv = n + Math.pow(10,order)
  return rv
}

function linLogMSBucket(v) {
  assert(v >= 0, "value is less than zero")

  var order, mult, n, rv

  if (v < 1)
    order = 0
  else
    order = order10(v)

  mult = Math.pow(10,order)
  n = Math.floor(v/mult)

  rv = sprintf("%d %s", n, logMSBucket(v))

  return rv
}


var logNS = Stats.logNS = new Bucketer(logNSOrder, logNSBucket)

var logNSBuckets = [
  'ns'
, '10 ns'
, '100 ns'
, 'us'
, '10 us'
, '100 us'
, 'ms'
, '10 ms'
, '100 ms'
, 'sec'
, '10 sec'
, '100 sec'
, '10^3 sec'
, '10^4 sec'
, '10^5 sec'
, '10^6 sec'
, 'lot-o-sec'
]
var logNSOrders = objIdx(logNSBuckets)

function logNSOrder(bucket) {
  var order = logNSOrders[bucket]
  return order
}

function logNSBucket(v) {
  assert(v >= 0, "value is less than zero")

  var order

  if (v < 1)
    order = 0
  else
    order = order10(v)

  if (order > logNSBuckets.length-1)
    return logNSBuckets[logNSBuckets.length-1]

  return logNSBuckets[order]
}

var semiLogNS = Stats.semiLogNS = new Bucketer(semiLogNSOrder, semiLogNSBucket)

var semins = [], semins_re = [], semins_sep=" "
semins[0] = "1-2" ; semins_re[0] = "1-2"
semins[1] = "2-5" ; semins_re[1] = "2-5"
semins[2] = "5-10"; semins_re[2] = "5-10"

var semins_reStr = sprintf("^((?:%s)|(?:%s)|(?:%s))%s(.*)$",
                           semins_re[0], semins_re[1], semins_re[2], semins_sep)
  , semins_rx = new RegExp(semins_reStr)

function semiLogNSOrder(bucket) {
  var m = semins_rx.exec(bucket)
  //assert.notStrictEqual(m, null)
  if (m === null) {
    throw new Error(format("semiLogNSOrder: regex failed. bucket='%s' re=/%s/", bucket, re))
  }

  var pre = m[1]
    , bkt = m[2]
    , f, order = logNSOrder(bkt)

  switch (pre) {
    case semins[0]: f=0; break;
    case semins[1]: f=0.2; break;
    case semins[2]: f=0.5; break;
    default: throw new Error("should not happen")
  }

  //log("semiLogNSOrder: bkt=%s; order=%d;", bucket, order+f)

  return order+f
}

function semiLogNSBucket(v) {
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
    pre = semins[0]
  }
  else if (fract >= 2 && fract < 5) {
    //pre = "2,<5"
    pre = semins[1]
  }
  else if (fract >= 5 && fract < 10) {
    //pre = "5,<10"
    pre = semins[2]
  }
  else throw Error(format("should not happen; v=%s; fract=%s;", v, fract))

  var logbkt = logNSBucket(v)

  //rv = format("%s %s", pre, logbkt)
  rv = pre + semins_sep + logbkt

  return rv
}

var linLogNS = Stats.linLogNS = new Bucketer(linLogNSOrder, linLogNSBucket)

//linLogNSOrder just used for ordering buckets; it is NOT used as an
// index into anything, so the returned number is semi-arbitrary.
function linLogNSOrder(bucket) {
  var match = /^(\d+) (.*)$/.exec(bucket)
  var n = parseInt(match[1], 10)
    , order = logNSOrder(match[2])
    , rv = n + Math.pow(10,order)
  return rv
}

function linLogNSBucket(v) {
  assert(v >= 0, "value is less than zero")

  var order, mult, n, rv

  if (v < 1)
    order = 0
  else
    order = order10(v)

  mult = Math.pow(10,order)
  n = Math.floor(v/mult)

  rv = sprintf("%d %s", n, logNSBucket(v))

  return rv
}


var bytes = Stats.bytes = new Bucketer(bytesOrder, bytesBucket)

var bytesBuckets = [
  "bytes"
, "KB"
, "MB"
, "GB"
, "TB"
, "PB"
, "EB"
, "YB"
, "lots-o-bytes"
]
var bytesOrders = objIdx(bytesBuckets)

function bytesOrder(bucket) {
  return bytesOrders[bucket]
}

function bytesBucket(v) {
  assert(v >= 0, "value is less than zero")

  var order

  if (v < 1)
    order = 0
  else
    order = order2(v)

  var o = Math.floor(order/10)

  if (o > bytesBuckets.length-1)
    return bytesBuckets[bytesBuckets.length-1]

  return bytesBuckets[o]
}

var semiBytes = Stats.semiBytes = new Bucketer(semiBytesOrder, semiBytesBucket)

var semibyt = [], semibyt_re = []
semibyt[0] = "1-64"    ; semibyt_re[0] = "1-64"
semibyt[1] = "64-192"  ; semibyt_re[1] = "64-192"
semibyt[2] = "192-448" ; semibyt_re[2] = "192-448"
semibyt[3] = "448-1024"; semibyt_re[3] = "448-1024"

var semibyt_re = sprintf("^((?:%s)|(?:%s)|(?:%s)|(?:%s)) (.*)$",
                          semibyt_re[0], semibyt_re[1], semibyt_re[2],
                          semibyt_re[3])
  , semibyt_rx = new RegExp(semibyt_re)

function semiBytesOrder(bucket) {
  var m = semibyt_rx.exec(bucket)
  if (m === null) {
    throw new Error(format("semiBytesOrder: regex failed. bucket='%s' re=/%s/", bucket, re))
  }

  var pre = m[1]
    , bkt = m[2]
    , f, order = bytesOrder(bkt)

  switch (pre) {
    case semibyt[0]: f=0.0; break;
    case semibyt[1]: f=0.2; break;
    case semibyt[2]: f=0.4; break;
    case semibyt[3]: f=0.6; break;
    default: throw new Error("should not happen")
  }

  return order+f
}

function semiBytesBucket(v) {
  assert(v >= 0, "value is less than zero")

  var byt = bytesBucket(v)

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
  //if (fract>=0   && fract<64  ) return format("%s %s", semibyt[0], byt)
  //if (fract>=64  && fract<192 ) return format("%s %s", semibyt[1], byt)
  //if (fract>=192 && fract<448 ) return format("%s %s", semibyt[2], byt)
  //if (fract>=448 && fract<1024) return format("%s %s", semibyt[3], byt)
  if (in_range(fract, 0, 64)    ) return format("%s %s", semibyt[0], byt)
  if (in_range(fract, 64, 192)  ) return format("%s %s", semibyt[1], byt)
  if (in_range(fract, 192, 448) ) return format("%s %s", semibyt[2], byt)
  if (in_range(fract, 448, 1024)) return format("%s %s", semibyt[3], byt)
  throw new Error(format("fract = %d", fract))
}

var logBytes = Stats.logBytes = new Bucketer(logBytesOrder, logBytesBucket)

//logBytesOrder just used for ordering buckets; it is NOT used as an
// index into anything, so the returned number is semi-arbitrary.
function logBytesOrder(bucket) {
  var n, order, rv
    , match = /^(\d+)-(\d+) (.*)$/.exec(bucket)

  n = parseInt(match[1], 10)
  order = bytesOrder(match[3])
  rv = n + Math.pow(2,order)

  //log("LogBytesOrder(%s) => %d", bucket, rv)
  return rv
}

function logBytesBucket(v) {
  assert(v >= 0, "value is less than zero")

  var byt = bytesBucket(v)

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
//  log("LogBytesBucket: return '%s'", s)
  return s
}
