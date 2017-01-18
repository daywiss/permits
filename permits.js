var lodash = require('lodash')
var assert = require('assert')

module.exports = Permits

function Permits(resume,handleChange, defaultType){
  var methods = {}
  var permissions = null
  var defaultType = defaultType || 'default'

  function parseBoolean(bool){
    if(bool === true) return bool
    if(bool === false) return bool
    if(bool == null) return null
    if(lodash.isString(bool)){
      return lodash.toUpper(bool) === 'TRUE'
    }
    return false
  }

  function onChange(permission){
    if(lodash.isFunction(handleChange)){
      handleChange(permission, [
          permission.userid,
          permission.type,
          permission.resourceid,
          permission.action
        ]
      )
    }
    return permission
  }

  function set(type,userid,resourceid,action,allowed){
    type = type || defaultType
    assert(userid,'requires userid')
    assert(resourceid,'requires resourceid')
    assert(action,'requires action')
    lodash.set(permissions,[userid,type,resourceid,action],parseBoolean(allowed))
    return makeObject(type,userid,resourceid,action,allowed)
  }

  function get(type,userid,resourceid,action){
    type = type || defaultType
    assert(userid,'requires userid')
    assert(resourceid,'requires resourceid')
    assert(action,'requires action')
    return lodash.get(permissions,[userid,type,resourceid,action],null)
  }

  function makeObject(type,userid,resourceid,action,allowed){
    return {
      userid:userid,resourceid:resourceid,action:action,allowed:allowed,type:type || defaultType
    }
  }

  function filter(tid,uid,rid,aid,allowid){
    return lodash.reduce(permissions,function(result,users,userid){
      if(uid && userid != uid) return result
      lodash.each(users,function(resources,type){
        if(tid && type != tid) return 
        lodash.each(resources,function(actions,resourceid){
          if(rid && resourceid != rid) return
          lodash.each(actions,function(allowed,action){
            if(aid && action != aid) return
            if(lodash.isBoolean(allowid) && allowed != allowid) return
            result.push(makeObject(type,userid,resourceid,action,allowed))
          })
        })
      })
      return result
    },[])
  }

  function init(){
    permissions = {}
    lodash.each(resume,function(item){
      set(item.type,item.userid,item.resourceid,item.action,item.allowed)
    })
    return Type(null,methods)
  }

  function scope(type){
    assert(type,'requires resource type')
    return Type(type,methods)
  }
  
  methods.set = set
  methods.get = get
  methods.filter = filter
  methods.scope = scope
  methods.init = init
  methods.onChange = onChange
  methods.makeObject = makeObject

  return init()
}

function Type(type,root){
  var methods = {}

  methods.type = function(t){
    return root.scope(t)
  }

  methods.can = function(userid,resourceid,action){
    return root.get(type,userid,resourceid,action)
  }

  methods.get = function(userid,resourceid,action){
    var allowed = root.get(type,userid,resourceid,action)
    return root.makeObject(type,userid,resourceid,action,allowed)
  }

  methods.set = function(userid,resourceid,action,allowed){
    return root.onChange(root.set(type,userid,resourceid,action,allowed))
  }

  methods.allow = function(userid,resourceid,action){
    return methods.set(userid,resourceid,action,true,type)
  }

  methods.deny = function(userid,resourceid,action){
    return methods.set(userid,resourceid,action,false,type)
  }

  methods.clear = function(userid,resourceid,action){
    return methods.set(userid,resourceid,action,null,type)
  }

  methods.filter = function(props){
    assert(props,'requires an object with optional properties, userid, resourceid, action, allowed, type')
    return root.filter(props.type || type, props.userid,props.resourceid,props.action,props.allowed)
  }

  methods.getByUser = function(userid){
    assert(userid,'requires userid')
    return root.filter(type,userid)
  }

  methods.getByResource = function(resourceid){
    assert(resourceid,'requires resourceid')
    return root.filter(type,null,resourceid)
  }

  methods.getByResourceAndAction = function(resourceid,action){
    assert(resourceid,'requires resourceid')
    assert(action,'requires action')
    return root.filter(type,null,resourceid,action,true)
  }

  methods.getByUserAndAction = function(userid,action){
    assert(userid,'requires userid')
    assert(action,'requires action')
    return root.filter(type,userid,null,action,true)
  }

  methods.getByUserAndResource = function(userid,resourceid){
    assert(userid,'requires userid')
    assert(resourceid,'requires resourceid')
    return root.filter(type,userid,resourceid)
  }

  methods.list = function(){
    return root.filter(type)
  }

  methods.root = function(call){
    assert(call,'requires object with a method property to call')
    assert(call,method,'requires method to call')
    try{
      return root[call.method](call.type,call.userid,call.resourceid,call.action,call.allowed)
    }catch(e){
      throw new Error('call failed: ' + e.message)
    }
  }

  return methods
}

