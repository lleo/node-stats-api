/* global describe it */

var assert = require('assert')
  , fs = require('fs')
  , utils = require('../lib/utils')
  , rand = utils.rand
  , isodatetime = utils.isodatetime
  , Stats = require('..')
  , stats = Stats()
  , testNS
  , data = JSON.parse( fs.readFileSync('./test/data.json') )
  , timings = JSON.parse( fs.readFileSync('./test/timings.json'))
  , intervalMS = 100
  , outputFN = "output.txt-"+isodatetime()
  , outputStr

//describe("", function(){
//  it("", function(){})
//})

describe("Create some stats in the 'test0' NameSpace", function(){
  it("assign testNS = stats.get('test0')", function(){
    testNS = stats.get('test0')
  })

  describe("Value Stat", function(){

    it("create a bytes Value Stat named 'size'", function(){
      testNS.createStat("size", Stats.Value, {units: "bytes"})
    })

    it("add one value to 'size'", function(){
      testNS.get('size').value = rand(1024)
    })
  })

  describe("TimerMS Stat", function(){
    it("create a TimerMS stat named 'ttHitMS'", function(){
      testNS.createStat('ttHitMS', Stats.TimerMS)
      //testNS.get('ttHitMS').on('value', function(v){
      //  Stats.error("ttHitMS.value = %d", v)
      //})
    })
  })

  describe("TimerNS Stat", function(){
    it("create a TimerNS stat named 'ttHitNS'", function(){
      testNS.createStat('ttHitNS', Stats.TimerNS)
      //testNS.get('ttHitNS').on('value', function(v){
      //  Stats.error("ttHitNS.value = %d", v)
      //})
    })
  })

  describe("Count Stat", function(){
    it("create a Count stat not bound to another stat named 'hits'", function(){
      testNS.createStat('hits', Stats.Count, {units: "hits"})
    })

    it("create a Count stat bound to 'size' stat named 'reqs'", function(){
      var size = testNS.get('size')
      //testNS.set('reqs', new Stats.Count({stat: size, units: "reqs"}))
      testNS.createStat('reqs', Stats.Count, {stat: size, units: "reqs"})
    })
  })

  describe("Rate Stat", function(){
    it("create a Rate Stat named 'thruput/sec' tied to 'size' w/defaults"
      , function(){
          testNS.createStat( "thruput/sec", Stats.Rate
                           , {stat: testNS.get('size')} )
        })

    it("create a Rate Stat named 'thruput/min' tied to 'size' w/interval='min'"
      , function(){
          testNS.createStat( "thruput/min", Stats.Rate
                           , {stat: testNS.get('size'), interval:"min"} )
        })
  })

  describe("Moving Average", function(){
    it("create a MovingAverage stat 'thruput/sec mavg' tied to 'thruput/sec'"
      , function(){
          testNS.createStat( "thruput/sec mavg", Stats.MovingAverage
                           , {stat: testNS.get("thruput/sec")} )
        })
  })

  describe("Running Average", function(){
    it("create a RunningAverage stat 'thruput/sec ravg' tied to 'thruput/sec'"
      , function(){
          testNS.createStat( "thruput/sec ravg", Stats.RunningAverage
                           , {stat: testNS.get("thruput/sec")} )
        })
  })

  describe("Histograms", function(){
    it("create Histogram for 'ttHitMS' w/logMS Bucketer", function(){
      testNS.createHistogram('hog ttHitMS logMS', 'ttHitMS', Stats.logMS)
    })

    it("create Histogram for 'ttHitNS' w/logNS Bucketer", function(){
      testNS.createHistogram('hog ttHitNS logNS', 'ttHitNS', Stats.logNS)
    })

    it("create Histogram for 'ttHitMS' w/semiLogMS Bucketer", function(){
      testNS.createHistogram('hog ttHitMS semiLogMS', 'ttHitMS', Stats.semiLogMS)
    })

    it("create Histogram for 'ttHitNS' w/semiLogNS Bucketer", function(){
      testNS.createHistogram('hog ttHitNS semiLogNS', 'ttHitNS', Stats.semiLogNS)
    })

    it("create Histogram for 'ttHitMS' w/linLogMS Bucketer", function(){
      testNS.createHistogram('hog ttHitMS linLogMS', 'ttHitMS', Stats.linLogMS)
    })

    it("create Histogram for 'ttHitNS' w/linLogNS Bucketer", function(){
      testNS.createHistogram('hog ttHitNS linLogNS', 'ttHitNS', Stats.linLogNS)
    })

    it("create Histogram for 'size' w/linearBytes Bucketer", function(){
      testNS.createHistogram('hog size linearBytes', 'size', Stats.linearBytes)
    })

    it("create Histogram for 'size' w/bytes Bucketer", function(){
      testNS.createHistogram('hog size bytes', 'size', Stats.bytes)
    })

    it("create Histogram for 'size' w/semiBytes Bucketer", function(){
      testNS.createHistogram('hog size semiBytes', 'size', Stats.semiBytes)
    })

    it("create Histogram for 'size' w/logBytes Bucketer", function(){
      testNS.createHistogram('hog size logBytes', 'size', Stats.logBytes)
    })

    //it("", function(){})
  })

  describe("accumulate data and write to "+outputFN, function(){
    it("accumulate data for 1.1 minutes", function(done){
      var dataIdx=0, intervalId, timerId, timerIdx=0, hitMSDone, hitNSDone
      this.timeout(1.5*60*1000)

      function timerFn(){
        hitMSDone()
        hitNSDone()
        testNS.get('hits').inc()
        if (timerIdx+1 < timings.length) {
          timerIdx += 1
          //Stats.error("timerFn: wait %d ms", timings[timerIdx])
          timerId = setTimeout(timerFn, timings[timerIdx])
          hitMSDone = testNS.get('ttHitMS').start()
          hitNSDone = testNS.get('ttHitNS').start()
        }
      }
      //Stats.error("before timerFn: wait %d ms", timings[timerIdx])
      timerId = setTimeout(timerFn, timings[timerIdx])
      hitMSDone = testNS.get('ttHitMS').start()
      hitNSDone = testNS.get('ttHitNS').start()

      intervalId = setInterval(function intvlFn(){
        if (dataIdx < data.length) {
          testNS.get('size').value = data[dataIdx]
          dataIdx += 1
          return
        }
        //var curOutput = testNS.toString({ values: "both", hash: false })
        //fs.writeFileSync(outputFN, curOutput)
        clearInterval(intervalId)
        done()
      }, intervalMS)
    })
    it("should generate the output vi testNS.toString()", function(){
      outputStr = testNS.toString({values:"both", hash:false, commify: true})
      assert.ok(outputStr.length > 0)
    })
    it("should write generated string to "+outputFN, function(){
      fs.writeFileSync(outputFN, outputStr)
    })
  })

})

//
