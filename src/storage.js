// all methods return promises
//stored docs also have low res thumbnails embedded
export class Storage {
    save(doc) {
        const json = this.DocToJSON(doc)
        const str = JSON.stringify(json)
        localStorage.setItem('maindoc', str)
        return Promise.resolve(true)
    }

    list() {
        const img = new Image()
        img.width = 64
        img.height = 64
        return Promise.resolve(
            [{
                id: "maindoc",
                title: 'some doc',
                thumbnail: img
            }]
        )
    }

    //loads the actual JSON to an object graph
    load(docid) {
        const str = localStorage.getItem(docid)
        const json = JSON.parse(str)
        const doc = this.JSONToDoc(json)
        return Promise.resolve(doc)
    }

    //expands the layer data into actual canvas objects
    JSONToDoc() {

    }
    //turns canvas objects into layer data
    DocToJSON() {

    }
}
