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
    
    stats.createStat('rsp time', statsmod.Timer)
    stats.createStat('rsp size', statsmod.Value, {units:'bytes'})
    stats.createHistogram('rsp time hog', 'rsp time', stats.LinLogMS)
    stats.createHistogram('rsp size hog', 'rsp size', stats.LogBytes)
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
    HOG rsp time hog
          %14       %14       %14       %28       %28
      4 10 ms 4 10^2 ms 5 10^2 ms 6 10^2 ms 7 10^2 ms
    HOG rsp size hog
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

