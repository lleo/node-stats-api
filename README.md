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

Here is a sketched out example code of using stats, histograms, and namespaces.

    var Stats = require('stats')
      , stats = Stats() //a singleton NameSpace for all your stats, histograms,
                        // and namespaces
                        //returns a singleton via `new Stats()` as well
      , myns = stats.createNameSpace('my app')    

    myns.createStat('rsp time', Stats.TimerMS)
    myns.createStat('rsp size', Stats.Value, {units:'bytes'})
    myns.createHistogram('rsp time linLogMS', 'rsp time', Stats.linLogMS)
    myns.createHistogram('rsp size logBytes', 'rsp size', Stats.logBytes)
    ...
    done = myns.get('rsp time').start()
    conn.sendRequest(req, function(err, rsp) {
      ...
      done()
      myns.get('rsp size').set(rsp.size)
    })
    ...
    console.log(myns.toString())
    console.log(stats.get('my app').toString()) //works the same
    console.log(stats.toString()) //works as well with additional indentation

The output might look like this:

    STAT rsp time 705 ms
    STAT rsp size 781
    HOG rsp time linLogMS
          %14       %14       %14       %28       %28
      4 10 ms 4 10^2 ms 5 10^2 ms 6 10^2 ms 7 10^2 ms
    HOG rsp size logBytes
                 %57    %42
      512-1024 bytes 1-2 KB

Sure it could be prettier, but you get the gist of the data.

For Histograms there is also an output mode that tries to semi-graphically
display the output in bars of '#' characters. File sizes of my home directory
looks like this:

    console.log(myns.toString({hash:true}))

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
    myns.set('req_size', req_size)

or

    myns.createStat('req_size', Stats.Value, {units:'bytes'})

When a new request comes in we just set the value for 'req_size' like so:

    req_size.value = req.size //setting .value causes an event

or

    myns.get('req_size').value = req.size //setting .value causes an event

[Note: From this point on I am just going to use the NameSpace version of
this API because that is how you _should_ be using this API.]

I could consume this Stat for another stat like a RunningAverage, AND for a
Histogram.

    myns.createStat('req_size_ravg', Stats.RunningAverage, {nelts:10})
    myns.createHistogram('req_size', 'req_size', Stats.LogBytes)

Both the RunningAverage and Histogram will be automagically be updated when
we set the value of the 'req_size' Stat. Also, not that the Histogram can
have the same name as the Stat ('req_size'). This is because all names
exists in a unified namespace regardless of kind (`Stat`, `Histogram`,
or `NameSpace`).

For Histograms there is an additional object called the Bucketer (I
considered calling them Bucketizers but that was longer:P). The Bucketer,
takes the value and generates a name for the Histogram bucket to increment.
The Bucketer is really just a pair of functions: the `bucket()` function which
takes a value and returns a bucket name; and a `order()` function which takes
a bucket name and returns a arbitrary number used to determine the order each
bucket is display in. The Bucketer maintains no state so there are a number
of already instantiated `Bucketer()` classes which are just a stateless pair of
`bucket()`/`order()` functions.

# API Overview

## Base classes

### `Stat`
Has no internal state.

Inherits from `EventEmitter`.

#### Methods
* `publish(err, value)`

```javascript
if (err) emit('error', err, value)
else     emit('value', value)
```

* `reset()`

Emit a `reset` event.

### `Value([opt])`
`opt` is a optional object with only one property 'units' which is used
in `toString()`

Inherits from Stat.

#### Properties

* `_value`
  Internal, aka private, storage variable for the value of a stat.

* `value`
  Assigning to `value` causes a publish. (ssh! its magic)

* `units` 
  String describing what is stored.

#### Methods
* `set(value)`
  Stores and publishes `value`

* `get()`
  Returns what is stored in `value` property.

* `reset()`
  Set `_value` to `undefined` and emit a `reset` event.

* `toString([opt])`
  * `opt.sigDigits` number of significant digits of value displayed.
     Default: 6
  * `opt.commify` boolean that specifies wheter to put commas in the integer
    part of the displayed value. (Sorry for all those in different locales)
    Default: false



### `TimerMS()`
Measures to time between when the `start()` method is called and when the
function `start()` returned is executed. This time delta is measured in 
milliseconds via `Date.now()`.

Inherits from `Value`.

#### Methods
* `start()`
  Returns a function closed over when `start()` was called.
  When that function is called (no args), it stores & publishes the current
  time versus the time when `start()` was called. Its return the difference
  in milliseconds. If it is called with an arg, that arg is published as the
  error and the time delta as the second argument.



### `TimerNS()`
Measures to time between when the `start()` method is called and when the
function `start()` returned is executed. This time delta is measured in 
nanoseconds via `process.hrtime()`.

Inherits from `Value`.

#### Methods
* `start()`
  Returns a function closed over when `start()` was called.
  When that function is called (no args), it stores & publishes the current
  time versus the time when `start()` was called. Its return the difference
  in nanoseconds. If it is called with an arg, that arg is published as the
  error and the time delta as the second argument.



## Consuming Stat classes

### `Count(opt)`
`opt` is a object with only one required property 'units' which is used in
`toString()`. The second property `stat` provides a Stat object.
When the Stat object emits a value `inc(1)` is called.

Inherits from Value which inherits from Stat. So there is `publish()`,
`set()`, `get()`, `toString()`

###Options
* `units` (required)
* `stat` (optional) If provided the Count object will call `inc()` on every
  'value' event.

### Methods
* `inc([i])`
  Increments the internal value by `i` and publishes `i`. If no argument is
  provided `i = 1`.

* `reset()`
  Sets the count to 0. Emits a `reset` event. Returns the old count value.

* `reset()` set internal value to 0, and emit a 'reset' event. Return the old
  value.

### `Rate(opt)`
`opt` is a required object with the following properties:

#### Options
* `stat` (required) Stat object. When the Stat object emits a `'value'` Rate
  will accumulate the `value` to its' internal `acc` property.
* `period` (default: 1) number of `interval` milliseconds between publishes
  of the calculated rate. Additionally, we calculate rate by dividing the
  internal `acc` property by `period` (eg. `value = acc / period`).
* `interval` (default: 'sec') a string ('ms','sec','min','hour', or 'day')
  sets number of milliseconds per `period`. Additionally it sets the `units`
  property to be `stat.units+"/"+interval`.

#### Methods
* `add(value)` Add `value` to the internal value of Rate

* `reset()` set internal accumulator value to 0, and emit a 'reset' event.
  Return with the old value.

### `MovingAverage(opt)`
`opt` is a required object with one required property `stat` and two optional `units` and `nelts`.

`opt.stat` must be a object of type Stat.

'opt.units' is optional. If it is provided it will be used instead of 
`opt.stat.units` . Mostly, `opt.units` is not needed.

`nelts` ioptional and defaults to 10. It is the number of values stored to
calculate the moving average. [see Wikipedia's Simple moving average definition][MovingAverage]

[MovingAverage]: http://en.wikipedia.org/wiki/Moving_average#Simple_moving_average
  "Wikipedia's entry for Simple moving average"

##### Methods
* `add(v)` adds a value `v` to the MovingAverage's fixed internal array of
    the last `nelts` values.

* `toString()` returns `format("%s %s", mavg, units)` where `mavg` is the
  last calculated moving average or the average of the values accumulated so
  far if the number of values is less than `nelts`.

* `reset()` sets the internal `_value` to 0. Deletes the internal list of the
  last `nelts` values. Emit a 'reset' event. Returns the old `_value`.

### `RunningAverage(opt)`
`opt` is a required object with one require property 'stat' and two optional
properties: `units` and `nelts`.

`opt.stat` must be a object of type Stat.

'opt.units' is optional. If it is provided it will be used instead of 
`opt.stat.units` . Mostly, `opt.units` is not needed.

`opt.nelts` is optional and defaults to 10. It is the number used to calculate
the running average. [see Wikipedia's Running moving average definition][RunningAverage]

[RunningAverage]: http://en.wikipedia.org/wiki/Moving_average#Modified_moving_average
  "Wikipedia's entry for Modified moving average"

##### Methods
* `add(v)` uses the value `v` to calculate the RunningAverage

## Histogram Bucketer classes

### `Bucketer(bucketFn, orderFn)`
The Bucketer base class.

The `bucketFn` takes a value and returns a "bucket" string.

The `orderFn` takes a "bucket" string and returns an number that is only used
for greater-than/less-than ordering comparisons for display purposes. For
exampele bucket strings: "1 foo" "2 foos" "3 foos" "many foo", "1 bar",
"2 bars", "3 bars", "many bar", etc could map to 1.0, 1.0001, 1.002, 1.03,
1.4, 2.0001, 2.002, 2.03, and 2.4. And that would work perfectly well.

### `LinearBucketer(base, units)`
This is close to useless, but I included it for completeness. `base` is used
as a divisor for the values passed to the `linear.bucket(v)` function. Often
one would use 10 as the base resulting in a bucket for every 10, 20, 30,
etcetra values.

## Histogram Bucketer objects
These objects are really just pairs of functions as the bucketizing functions
are algorithmic and the units are built in.

* `linearMS`
  LinearBucketer order=10 units="ms"

* `linearNS`
  LinearBucketer order=10 units="ns"

* `linearByes`
  LinearBucketer order=10 units="bytes"

* `logMS`
  The buckets are "ms", "10 ms", "100 ms", "sec", "10 sec", "100 sec",
   "10^3 sec", "10^4 sec", "10^5 sec", "10^6 sec", "lot-o-sec".
  
  These buckets should read "single digit milliseconds", "tens of milliseconds",
  "hundreds of millisecons", "single digit seconds", "tens of seconds",
  "hundreds of seconds", "thousands of seconds", "millions of seconds" and
  "a whole shit-load of seconds".

* `semiLogMS`
  buckets map to "1-2 "+logMS(v), "2-4 "+logMS(v), "5-10"+logMS(v) where
  "x-y" means a range inclusive of x and exclusive of y aka `[x,y)`.
  These bucket names should be read at "one or two ms", "two thru 4 ms",
  "five thru ten ms".

  "1-2" is 2 wide, "2-4" is 3 wide, 5-10 is 5 wide; with a progression of
  2, 3, 5. That is what "semiLog" means. It sorta makes sence if you look
  at it from the right direction and cock you head to the side.

* `linLogMS`
  The buckets map to n+" "+logMS(v) where n is an integer.

  They are read as "one ms", "two ms", "three ms", etcetra.

* `logNS`
  Same as logMS but with 'ns' (nanosecond) and 'us" (microsecond) on the
  low-end.

* `semiLogNS`
  ditto with `logNS`

* `linLogNS`
  ditto with `logNS`

* `bytes`
  The buckets are "bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB", and 
  "lots-o-bytes".
  
  These are classic orders of 10s of bytes ie 2^10, 2^20, 2^30, etc. KiB, MiB,
  GiB are crap created to appease marketroids and their lickspittle lackeys.
  Grrr... don't get me going ;)
  
  They are kilobytes, megabytes, gigabytes, terabytes, petabytes, exabytes,
  zettabytes, yottabytes, and shit-load-of-bytes.

* `semiBytes`
  The buckets are "1-64 "+bytes(v), "64-192 "+bytes(v), "192-448 "+bytes(v),
  and "448-1024 "+bytes(v)
  
  The width of each bucket is progressively bigger "1-64" is 64 wid", "64-192"
  is 128 wide, "192-448" is 256 wide, and "448-1024" is 576 wide. So the
  progression is 64, 128, 256, 576 to cover a 1024 range. That fuzzy-ness is
  what "semi"  means.

* `logBytes`
  The buckets are "0-2 "+bytes(v), "2-4 "+bytes(v), "4-8 "+bytes(v),
  "8-16 "+bytes(v), "16-32 "+bytes(v), 32-64 "+bytes(v), "64-128 "+bytes(v),
  "12-256 "+bytes(v), "256-512 "+bytes(v), and "512-1024 "+bytes(v).
  
  So first we cut the ranges down by the 2^(n*10), then by plain log2() for the
  0-1024 remainder.

## Bottom line is that semiLogMS, semiLogNS, and semiBytes are probably your
best choice for mentally visualizing your data.


## Summery of All Display Options

Every toString() of every Stat type, Histogram, and NameSpace takes an
optional "Options" object. These settings intentionally have different
names, and a given name means the same thing anywhere it is used.
