var test = require('tape')
var Permits = require('./')
var lodash = require('lodash')

function run(t,Permits){
  var permits = null
  var type = null
  var resume = lodash.times(3,function(i){
    return {
      userid:'user'+i,
      resourceid:'resource'+i,
      action:'action'+i,
      allowed:true,
      type:'test'
    }
  })

  t.test('permits',function(t){
    t.test('init',function(t){
      permits = Permits(resume,console.log.bind(console),'test')
      type = permits.type('test')
      t.ok(permits)
      t.end()
    })
    t.test('list',function(t){
      var result = permits.list()
      t.equal(result.length,resume.length)
      t.end()
    })
    t.test('can',function(t){
      var result = permits.can('user1','resource1','action1')
      t.ok(result)
      t.end()
    })
    t.test('get',function(t){
      var result = permits.get('user2','resource2','action2')
      t.equal(result.userid,'user2')
      t.ok(result.allowed)
      t.end()
    })
    t.test('allow',function(t){
      var result = permits.allow('user0','resource0','action1')
      t.equal(result.allowed,true)
      t.end()
    })
    t.test('deny',function(t){
      var result = permits.deny('user0','resource0','action2')
      t.equal(result.allowed,false)
      t.end()
    })
    t.test('clear',function(t){
      var result = permits.clear('user0','resource0','action3')
      t.equal(result.allowed,null)
      t.end()
    })
    t.test('getByUser',function(t){
      var result = permits.getByUser('user0')
      t.ok(result.length)
      t.end()
    })
    t.test('getByResource',function(t){
      var result = permits.getByResource('resource1')
      t.equal(result.length,1)
      t.end()
    })
    t.test('getByUserAndResource',function(t){
      var result = permits.getByUserAndResource('user1','resource1')
      t.equal(result.length,1)
      t.end()
    })
    t.test('getByResourceAndAction',function(t){
      var result = permits.getByResourceAndAction('resource0','action0')
      t.equal(result.length,1)
      t.end()
    })
    t.test('getByUserAndAction',function(t){
      var result = permits.getByUserAndAction('user0','action1')
      t.equal(result.length,1)
      t.end()
    })
    t.test('filter',function(t){
      var result = permits.filter({allowed:false})
      t.equal(result.length,1)
      t.end()
    })
    t.test('filter with resourceid',function(t){
      var result = permits.filter({resourceid:'resource1'})
      t.equal(result.length,1)
      t.equal(result[0].userid,'user1')
      t.end()
    })
  })
}

if(require.main == module){
  run(test,Permits)
}else{
  module.exports = run
}
