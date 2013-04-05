/* global describe it */

var assert = require('assert')
  , Stats = require('..')
  , stats = Stats()

describe("NameSpace", function(){
  it("createNameSpace 'test0' in global Stats() NameSpace", function(){
    stats.createNameSpace("test0")
  })

  it("toString()", function(){
    assert.ok(stats.toString() == "NS test0\n")
  })

  it("createNameSpace 'test0' in global Stats() NameSpace should blow up"
    , function(){
        assert.throws(function(){ stats.createNameSpace("test0") })
      }
    )

  it("createNameSpace 'test1' in global Stats() NameSpace", function(){
    stats.createNameSpace("test1")
  })
  it("toString()", function(){
    assert.ok(stats.toString() == "NS test0\n\nNS test1\n")
  })

})