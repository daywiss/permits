#Permits (Permissions)
Simple but powerful in memory permission manager and query interface.
Allows you to set permissions for users on resources with arbitrary string ids.
Also has change event callbacks for syncronizing with persistent store.

#Install
`npm install permits`

#Philosophy
This library assumes that all things are identified by unique string ids. 
There are 3 fundamental building blocks, the user, the resource and the action to be taken.
This allows you to set and get which user can take what action on which resource.
All data is stored in a nested object to reduce the total number of keys on a single object since there could be very very many.
The entire nested structure can be easily filtered over to find any particular combination of entries. 

#Usage
```js
  var Permits = require('permits')

  var permissions = Permits()

  //gives "userid" the ability to do "allowedAction" on "resourceid"
  var result = permissions.allow('userid','resourceid','allowedAction')

  // result is a permissions object in the form 
  // { 
  //   userid:'userid',
  //   resourceid:'resourceid',
  //   action:'action'
  //   allowed:true,
  //   type:'default' //optionally define a resource type, defaults to "default"
  //  }

  //can == true
  var can = permissions.can('userid','resourceid','allowedAction')

  //denys user ability to do deniedAction
  var result = permissions.deny('userid','resourceid','deniedAction')

  //can == false
  var can = permissions.can('userid','resourceid','deniedAction')

  //clear user ability to do neutralAction
  var result = permissions.clear('userid','resourceid','neutralAction')

  //can == null
  var can = permissions.can('userid','resourceid','neutralAction')
```

#Restore and Persist
Restore permissions from a persistent data store and syncronizes any changes back into the database.
```js
  //assume we have a persistent store
  var Store = require('permissionStore')
  var Permits = require('permits')
  
  function upsert(permission,path){
    //assume store has an upsert function which takes an object with an id property
    permissions.id = path.join('.')
    Store.upsert(permissions)
  }

  //assume store gets entire table as an array with getAll()
  var permissions = Permits(Store.getAll(),upsert)

 //any new permissions will be upserted into database
 permissions.allow(...)

```

#Resource Types
You may want to organize your resources by types and scope your permission methods to those types.
```js
  var Permits = require('permits')

  //your global permissions, this object works on the default permission type: 'default'
  var permissions = Permits(resume,onChange)

  //create permission types called books, which will still be accessible from the permissions object.
  var books = permissions.type('books')

  //these changes will trigger onChange callback on the permissions object
  books.allow('someuser','booktitle','canRead')

  //true
  books.can('someuser','booktitle','canRead')

  //access book types from the main permissions object. always will be consistent with
  //other resource types, since they share the same object.
  permissions.type('books').get('someuser','booktitle','canRead')
  //this does the exact same thing
  permissions.get('someuser','booktitle','canRead','books')

  //returns a permissions object
  //{
  //  userid:'someuser',resourceid:'booktitle',action:'canRead',allowed:true, type:'books'
  //}

  //or use the default permission type
  permissions.deny(/*etc...*/)
  
```
#Permissions Object
This is how the permissions object is returned and emitted through change callbacks.

```js
 { 
   userid:'userid',
   resourceid:'resourceid',
   action:'action'
   allowed:true,  //allowed can be true false or null
   type:'default' //optionally define a resource type, defaults to "default"
  }
```

Internally The permissions object resides in a nested object organized into this structure:
```js
  {
    userid:{
      type:{
        resourceid:{
          action:true //true false or undefined
        }
      }
    }
  }
```
It is accessed through lodash .get and .set methods. It will also be returned as a path on change:

```
  path = [userid,type,resourceid,action]

```
You can use this to create a unique id for insertion into a traditional database. 

#API

##Initialize
Permits takes 3 options, an array of permissions, a callback function which gets executed every time permissions change and a string to define the default permissions type.

`Permits(resume,upsert)`

- resume(optional, array) - An array of permission objects to restore previous state.
- upsert(optional, function) - A callback function which can take 2 parameters
  `function upsert(permission,path){}`
  - permission - A permissions object which was just updated, in the form 

    ```js
     { 
       userid:'userid',
       resourceid:'resourceid',
       action:'action'
       allowed:true,  //allowed can be true false or null
       type:'default' //optionally define a resource type, defaults to "default"
      }
    ```

   - path - the unique path to this permission object as an array. Use to create your own ID in the form:
     `[userid,type,resourceid,action]`
- defaultType(optional, string) - defaults to the string 'default'. Set to whatever your default permissions resource type should be.

##Type
Creating a resource type is optional, by default just initialize the permits class and it is ready to be used.
If you need the ability to define seperate resources then use this function. All functions on the returned object
will be scoped to whatever resource type you define.  It has the same API as the permits object.

```
  var books = permits.type('books')
  //use books like a permits object, it has all the same functions
```

##Set
Multiple ways to set new permissions, they all trigger on change callback. Type is optional and defaults to
the either the default type, or the custom type.

`permits.set(userid,resourceid,action,allowed,type)`   
`permits.allow(userid,resourceid,action,type)`   
`permits.deny(userid,resourceid,action,type)`   
`permits.clear(userid,resourceid,action,type)`   

##Get
Gets full permissions object. Type is optional to override the default type.

`permits.get(userid,resourceid,action,type)`

##Can
Get a true, false or null answer for if a user can do something on a resource.  Type is optional to override default type.

`var result = permits.can(userid,resourceid,action,type)`

##Queries
There are many helper queries to get lists of permissions. These iterate over the entire structure, scoped to the resource type. Type is optional
to override the default type.

`permits.getByUser(userid,type)`   
`permits.getByResource(resourceid,type)`   
`permits.getByUserAndResource(userid,resourceid,type)`   
`permits.getByUserAndAction(userid,action,type)`   
`permits.getByResourceAndAction(resourceid,action,type)`   
   
- returns - An array of permission objects, or an emtpy array if none are found.

##Filter
If you need more search options you can filter directly on any permission parameter. All parameters
optional, if none provided all permissions will be returned, which is the same as `permit.list()`.
One caveat is that if you are filtering from a typed permissions, then it will only filter over that type.
Use the root permits object to search over all types.
 
```js
  var result = permits.filter({
    userid:'userid',         //optional userid to match, searches all users if omitted.
    resourceid:'resourceid', //optional resource id to match, searches all resources if omitted.
    action:'action',         //optional action to match, searches all actions if omitted.
    allowed:true,            //optional allowed to match, can be true or false. Searches all allowed states if omitted.
    type:'type',             //optional type to match. Searches all default type if omitted.
  })
```

##List
Get the entire permissions store as a list of permission objects. If using a typed permission, then it will only return 
the entirety of that type. Use the root permits object to get entire list. Type is optional.
`var list = permits.list(type)`

