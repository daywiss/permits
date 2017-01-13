var lodash = require('lodash')
var assert = require('assert')

module.exports = function(resume,handleChange){
  var methods = {}
  var permissions = {}
  var defaultType = 'default'

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
    console.log(permissions)
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

  methods.can = function(userid,resourceid,action,type){
    return get(type,userid,resourceid,action)
  }

  methods.get = function(userid,resourceid,action,type){
    var allowed = get(type,userid,resourceid,action)
    return makeObject(type,userid,resourceid,action,allowed)
  }

  methods.set = function(userid,resourceid,action,allowed,type){
    return onChange(set(type,userid,resourceid,action,allowed))
  }

  methods.allow = function(userid,resourceid,action,type){
    return methods.set(userid,resourceid,action,true,type)
  }

  methods.deny = function(userid,resourceid,action,type){
    return methods.set(userid,resourceid,action,false,type)
  }

  methods.clear = function(userid,resourceid,action,type){
    return methods.set(userid,resourceid,action,null,type)
  }

  methods.filter = function(props){
    assert(props,'requires an object with optional properties, userid, resourceid, action, allowed, type')
    return filter(props.type,props.userid,props.resourceid,props.action,props.allowed)
  }

  methods.getByUser = function(userid,type){
    assert(userid,'requires userid')
    return filter(type,userid)
  }

  methods.getByResource = function(resourceid,type){
    assert(resourceid,'requires resourceid')
    return filter(type,null,resourceid)
  }

  methods.getByResourceAndAction = function(resourceid,action,type){
    assert(resourceid,'requires resourceid')
    assert(action,'requires action')
    return filter(type,null,resourceid,action,true)
  }

  methods.getByUserAndAction = function(userid,action,type){
    assert(userid,'requires userid')
    assert(action,'requires action')
    return filter(type,userid,null,action,true)
  }

  methods.getByUserAndResource = function(userid,resourceid,type){
    assert(userid,'requires userid')
    assert(resourceid,'requires resourceid')
    return filter(type,userid,resourceid)
  }

  methods.list = function(){
    return filter()
  }

  methods.init = function(r,u){
    handleChange = u
    lodash.each(r,function(item){
      set(item.type,item.userid,item.resourceid,item.action,item.allowed)
    })
    return methods
  }


  return methods.init(resume,handleChange)
}
