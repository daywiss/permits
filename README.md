#Permits (Permissions)
Simple but powerful in memory permission manager and query interface.
Allows you to set permissions for users on resources with arbitrary string ids.
Also has change event callbacks for syncronizing with persistent store.

#Install
`npm install permits`

#Philosophy
This library assumes that all things are identified by unique string ids. 
It has 3 fundamental building blocks, the user, the resource and the action to be taken.
This allows you to set and get which user can take what action on which resource.
All data is stored in a nested object to reduce the total number of keys since there could be very many, 
but the entire object can be filtered over to find any particular combination of entries. 

#Usage
```js
  var Permits = require('permits')

  var permissions = Permits()

  //gives "userid" the ability to do "allowedAction" on "resourceid"
  var result = permissions.allow('userid','resourceid','allowedAction')

  //can == true
  var can = permission.can('userid','resourceid','allowedAction')

  // result is in the form 
  // { 
  //   userid:'userid',
  //   resourceid:'resourceid',
  //   action:'action'
  //   allowed:true,
  //   type:'default' //optionally define a resource type, defaults to "default"
  //  }

  //denys user ability to do deniedAction
  var result = permissions.deny('userid','resourceid','deniedAction')

  //can == false
  var can = permission.can('userid','resourceid','deniedAction')

  //clear user ability to do neutralAction
  var result = permissions.clear('userid','resourceid','neutralAction')

  //can == null
  var can = permission.can('userid','resourceid','neutralAction')
```

#Restore and Persist
```js
  //assume we have a persisten store
  var Store = require('permissionStore')
  var Permits = require('permits')
  
  function upsert(permission,path){
    //assume store has an upsert function which takes an object with an id property
    permissions.id = path.join('.')
    store.upsert(permissions)
  }

  //assume store gets entire table as an array with getAll()
  var permissions = Permits(store.getAll(),upsert)

 //any new permissions will be upserted into database

```

#API

##Initialize
Permits takes 2 options, an array of permissions, and a callback function which gets executed every time permissions change.

`Permits(resume,upsert)`

- resume - An array of permission objects to restore previous state.
- upsert - A callback function which can take 2 parameters
  `function upsert(permission,path){}`
  - permission - A permissions object in the form 
    ```js
     { 
       userid:'userid',
       resourceid:'resourceid',
       action:'action'
       allowed:true,
       type:'default' //optionally define a resource type, defaults to "default"
      }
    ```
   - path - the unique path to this permission object as an array. Use to create your own ID in the form:
     `[userid,type,resourceid,action]`

##Set
Multiple ways to set new permissions, they all trigger on change callback. Type is optional.

`var result = permits.set(userid,resourceid,action,allowed,type)`
`var result = permits.allow(userid,resourceid,action,type)`
`var result = permits.deny(userid,resourceid,action,type)`
`var result = permits.clear(userid,resourceid,action,type)`



##Get
Gets full permissions object. Type is optional.

`permits.get(userid,resourceid,action,type)`

##Can
Get a true, false or null answer for if a user can do something on a resource. Type is optional.

`var result = permits.can(userid,resourceid,action,type)`

##Queries
There are many helper queries to get lists of permissions. These iterate over the entire structure. 
Type is optional in all queries.

`var result = permits.getByUser(userid,type)`
`var result = permits.getByResource(resourceid,type)`
`var result = permits.getByUserAndResource(userid,resourceid,type)`
`var result = permits.getByUserAndAction(userid,action,type)`
`var result = permits.getByResourceAndAction(resourceid,action,type)`

- returns - An array of permission objects, or an emtpy array if none are found.

##Filter
If you need more search options you can filter directly on any permission parameter. All parameters
optional, if none provided all permissions will be returned, which is the same as `permit.list()`
```js
  var result = permits.filter({
    userid:'userid',         //optional userid to match
    resourceid:'resourceid', //optional resource id to match
    action:'action',         //optional action to match
    allowed:true,            //optional allowed to match, can be true or false
    type:'type',             //optional type to match
  })
```
##List
Get the entire permissions store as a list of permission objects.
`var list = permits.list()`

