const Contact = descObject('contact',{
    address:Storage.String,
    name:Storage.String,
},
    {
        constraints: [
            (obj)=> obj.name.contains('@')
        ]
    })

const Message = descObject('message',{
    subject:Storage.String,
    from:[Storage.ref(Contact)],
    to:[Storage.ref(Contact)],
    sent:Storage.timestamp,
    body:Storage.String,
},{ // options
    constructor: () => new CustomMessageObject(), // you could include any custom init code in here too
    update:(obj, keyvals) => {
        Object.keys(keyvals).forEach(key => {
            obj[key] = keyvals[key]
        })
    },
    toJSON:(obj) => {
        return { subject: obj.subject, from: obj.from, to: obj.to}
    },
    fromJSON:(json) => {
        return new CustomMessageObject(json.subject, json.from, json.to)
    }
})

// could fromJSON and constructor be consolidated?

const Folder = descObject('folder',{
    title:Storage.String,
})

//everything is given UUIDs automatically as well as IDs for local storage tracking.

function makeDummyData(storage) {
    const bob = storage.makeObject(Contact, { name: 'Bob Smith', address:'bob@bob.com'})
    const alice = storage.makeObject(Contact, { name: 'Alice Gale', address:'alice@alice.com'})
    storage.makeObject(Message, { subject: "regarding stuff", from: bob, to: alice, body:"a long message"})
}

const data = openStorage('dataname',[Contact,Message,Folder],makeDummyData)

const messages = data.makeQuery({
    table:'message',
    parameters:{folder:'inbox'},
    find: (m,params) => m.folder === params.folder,
    sort: (a,b) => a.timeStamp - b.timeStamp,
    pick: ({subject,from,sent}) => {
       return {subject,from,sent}
    }
})

// messages.on()/off() to listen for changes
// messages.results() the actual values returned, only includes the objects from pick() function
// messages.setParameter(name,value or {}) refreshes the query with a new parameter
// for properties that are references you get the ID, or is it a ref to the real object?

messages.forEach(m => {
    console.log(`subject ${m.subject} from ${m.from.name}`) // from is stored as an ID connected to a contact, but it's returned as a reference to the actual object.
})

//all objects have actual ids stored as _id
//all objects have actual uuids stored as _uuid





