/* global describe it */

var assert = require('assert')

var Stats, stats

describe("Stats Module", function(){
  it("should load", function(){
    Stats = require('..')
  })

  it("require'd object should be a function", function(){
    assert.ok(typeof Stats === 'function')
  })

  it("Stats() works and should return a NameSpace object", function(){
    stats = Stats()
    assert.ok(stats instanceof Stats.NameSpace)
  })

  it("`new Stats()` also works & should return the same Singleton object"
    , function t(){
      var s = new Stats()
      assert.ok( stats === s )
    })
})