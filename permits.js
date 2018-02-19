var lodash = require('lodash')
var assert = require('assert')

module.exports = Permits

function Permits(resume,handleChange, defaultType){
  var methods = {}
  var permissions = null
  //for faster filtering
  var permissionByResource = null
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
    //secondary table for filtering by resourceid
    lodash.set(permissionsByResource,[resourceid,type,userid,action],parseBoolean(allowed))
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

  function filterByResource(tid,uid,rid,aid,allowid){
    return lodash.reduce(permissionsByResource,function(result,types,resourceid){
      if(rid && resourceid != rid) return result
      lodash.each(types,function(users,type){
        if(tid && type != tid) return 
        lodash.each(users,function(actions,userid){
          if(uid && userid != uid) return
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

  function filterByUser(tid,uid,rid,aid,allowid){
    return lodash.reduce(permissions,function(result,types,userid){
      if(uid && userid != uid) return result
      lodash.each(types,function(resources,type){
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

  function filter(tid,uid,rid,aid,allowid){
    //special case where we need to iterate all users but only 1 resource
    //this matters when table gets to millions of entries
    if(uid == null && rid) return filterByResource(tid,uid,rid,aid,allowid)
    return filterByUser(tid,uid,rid,aid,allowid)
  }

  function init(){
    permissions = {}
    permissionsByResource = {}
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

  methods.can = function(userid,resourceid,action,t){
    return root.get(t || type,userid,resourceid,action)
  }

  methods.get = function(userid,resourceid,action,t){
    var allowed = root.get(t || type,userid,resourceid,action)
    return root.makeObject(t || type,userid,resourceid,action,allowed)
  }

  methods.set = function(userid,resourceid,action,allowed,t){
    return root.onChange(root.set(t || type,userid,resourceid,action,allowed))
  }

  methods.allow = function(userid,resourceid,action,t){
    return methods.set(userid,resourceid,action,true,t)
  }

  methods.deny = function(userid,resourceid,action,t){
    return methods.set(userid,resourceid,action,false,t)
  }

  methods.clear = function(userid,resourceid,action,t){
    return methods.set(userid,resourceid,action,null,t)
  }

  methods.filter = function(props){
    assert(props,'requires an object with optional properties, userid, resourceid, action, allowed, type')
    return root.filter(props.type || type, props.userid,props.resourceid,props.action,props.allowed)
  }

  methods.getByUser = function(userid,t){
    assert(userid,'requires userid')
    return root.filter(t || type,userid)
  }

  methods.getByResource = function(resourceid,t){
    assert(resourceid,'requires resourceid')
    return root.filter(t || type,null,resourceid)
  }

  methods.getByResourceAndAction = function(resourceid,action,t){
    assert(resourceid,'requires resourceid')
    assert(action,'requires action')
    return root.filter(t || type,null,resourceid,action,true)
  }

  methods.getByUserAndAction = function(userid,action,t){
    assert(userid,'requires userid')
    assert(action,'requires action')
    return root.filter(t || type,userid,null,action,true)
  }

  methods.getByUserAndResource = function(userid,resourceid,t){
    assert(userid,'requires userid')
    assert(resourceid,'requires resourceid')
    return root.filter(t || type,userid,resourceid)
  }

  methods.list = function(t){
    return root.filter(t || type)
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

