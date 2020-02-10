
```javascript
const storage = Storage.getStorage({
    name:'mystoragename',
    schema: {
    
}
})







```

This will create new storage using that name in the local data store. If storage exists it will be
loaded. If it doesn't it will be created and makeDefault will be called to create default data for it.
