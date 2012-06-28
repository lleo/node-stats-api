Stats.js
========

Stats is a utility module which provides an API to collect internal
application statistics for your programs and libraries. It is very
thin and lite when running so as to not alter the performance of the
program it is attempting to observe. Most importantly it provides
Histograms of the stats it is observing to help you understand the
behavior of your program.

Specifically, for example, you can set up a stat for measure the time
elapsed between sending a request and receiving a response. That stat
can be fed into a Histogram to aid your understanding of the distribution
of that request/response stat.

Here is a sketched out example code of using stats and histograms.

    var statsmod = require('stats')
      , sts = statsmod.getStats() //a singleton NameSpace for all your stats
    
    stats.createStat('rsp time', Timer)
    stats.createStat('rsp size', Value, {units:'bytes'})
    stats.createHistogram('rsp time LinLogMS', 'rsp time', LinLogMS)
    stats.createHistogram('rsp size LogBytes', 'rsp size', LogBytes)
    ...
    done = stats.get('rsp time').start()
    conn.sendRequest(req, function(err, rsp) {
      ...
      done()
      stats.get('rsp size').set(rsp.size)
    })
    ...
    console.log(stats.toString())

The output might look like this:

    STAT rsp time 705 ms
    STAT file_sz 781
    HOG rsp time LinLogMS
          %14       %14       %14       %28       %28
      4 10 ms 4 10^2 ms 5 10^2 ms 6 10^2 ms 7 10^2 ms
    HOG rsp size LogBytes
                 %57    %42
      512-1024 bytes 1-2 KB

Sure it could be prettier, but you get the gist of the data.

For Histograms there is also an output mode that tries to semi-graphically
display the output in bars of '#' characters. File sizes of my home directory
looks like this:

    console.log(stats.toString({hash:true}))

    STAT file_sz 88
    HOG file_sz SemiLogBytes
          0-64 bytes %35 : ###################################
        64-192 bytes %10 : ##########
       192-448 bytes %16 : ################
      448-1024 bytes %10 : ##########
             0-64 KB %24 : ########################
         448-1024 KB %2  : ##

# How it works

There are three big kinds of things: Stats, Histograms, and NameSpaces. Stats
represent things with a single value (sorta). Histograms are, well, histograms
of Stat values, and NameSpaces are collections of named Stats, Histograms, and
other NameSpaces. Stats, Histograms, and NameSpaces are all EventEmitters, but
this mostly matters just for Stats.

The core mechanism for how this API works is that Stats emit 'value' events
when their value changes. Histograms and other Stat types consume these change
events to update their own values. For instance, lets say your base Stat is
a request size. We create a Stat for request size either directly or within
the context of a NameSpace:

    var req_size = new Value({units: 'bytes'})

or

    stats.createStat('req_size', Value, {units:'bytes'})

When a new request comes in we just set the value for 'req_size' like so:

    req_size.set(req.size)

or

    stats.get('req_size').set(req.size)

[Note: From this point on I am just going to use the NameSpace version of
this API because that is how you _should_ be using this API.]

I could consume this Stat for another stat like a RunningAverage, AND for a
Histogram.

    stats.createStat('req_size_ravg', RunningAverage, {nelts:10})
    stats.createHistogram('req_size', 'req_size', LogBytes)

Both the RunningAverage and Histogram will be automagically be updated when
we set the value of the 'req_size' Stat. Also, not that the Histogram can
have the same name as the Stat ('req_size'). This is because within a
NameSpace the three "big kinds" (Stat, Histogram, and NameSpace) are
segregated.

For Histograms there is an additional object called the Bucketer (I
considered calling them Bucketizers but that was longer:P). The Bucketer,
takes the value and generates a name for the Histogram bucket to increment.
The Bucketer is really just a pair of functions: the `bucket()` function which
takes a value and returns a bucket name; and a `order()` function which takes
a bucket name and returns a arbitrary number used to determine the order each
bucket is display in.

# API Overview

## Abstract Base class

### Stat
Has no internal stat and just one function.

#### Methods
* publish(err, value)
  if (err) emit('error', err, value)
  else     emit('value', value)

## Base Stat classes

### `Value([opt])`
`opt` is a optional object with only one property 'units' which is used
in `toString()`

### Methods
* `set(value)`
  Stores and publishes `value`
* `toString()`
  returns format("%d %s", value, units)

### `Timer()`
Stores the last value published

#### Methods
* `start()`
  Returns a function closed over when `start()` was called.
  When that function is called (no args) stores & publishes the current
  time versus the time when `start()` was called. If it is called with an
  arg, that arg is published as the error and the time delta as the second
  argument.
* `toString()`
  returns `format("%d %s", value, units)` where value is the last value
  published.

### `Count(opt)`
`opt` is a object with only one required property 'units' which is used in
`toString()`. The second property `stat` provides a Stat object.
When the Stat object emits a value `inc(1)` is called.

### Methods
* `inc([i])`
  Increments the internal value by `i` and publishes `i`. If no argument is
  provided `i = 1`.
* `toString()`
  returns format("%d %s", value, units)

### `Rate(opt)`
`opt` is a required object with the following properties:

#### Options
* `'units'` (required) is used in `toString()`. 
* `'stat'` (optional) Stat object. When `'value'` is emitted Rate will
  accumulate `value` to its' internal value property.
* `'period'` (default: 1) number of `interval` milliseconds between publishes
  of the calculated rate. Additionally, we calculate rate by dividing the
  internal value property by `period` aka `rate = value / period`.
* `'interval'` (default: 1000) number of milliseconds per `period`. For
  example, if `period` is 60 and `interval` is 1000 then the rate will be
  published every minute, where `rate = value / 60`.

#### Methods
* `add(value)` Add `value` to the internal value of Rate
* `reset()` set internal value to 0, and emit a 'reset' event with the old
  value as its' parameter.
* `toString()` returns `format("%s %s", last, units)` where `last` is the last
  value published with `publish()`.

## Consuming Stat classes

* Count
* Rate
* MovingAverage
* RunningAverage

## Histogram Bucketer classes

* Linear
* LogMS
* SemiLogMS
* LinLogMS
* Bytes
* SemiBytes
* LogBytes



