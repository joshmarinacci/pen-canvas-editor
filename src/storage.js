// all methods return promises
//stored docs also have low res thumbnails embedded
export class Storage {
    save(doc) {
        if(!doc.id) doc.id = `doc_${Math.floor(Math.random()*100000)}`
        const json = this.DocToJSON(doc)
        const str = JSON.stringify(json)
        localStorage.setItem(json.id, str)
        return this.list().then(index => {
            let entry = index.find(d => d.id === json.id)
            if(!entry) {
                entry = {
                    id: json.id,
                    title: json.title,
                }
                index.push(entry)
            } else {
                entry.title = json.title
            }
            localStorage.setItem('index',JSON.stringify(index))
            console.log("saved the index",index)
            return Promise.resolve(true)
        })
    }

    list() {
        let indexStr = localStorage.getItem('index')
        if(indexStr) return Promise.resolve(JSON.parse(indexStr))
        return Promise.resolve([])
    }

    clear() {
        return Promise.resolve(localStorage.clear())
    }

    //loads the actual JSON to an object graph
    load(id) {
        const str = localStorage.getItem(id)
        const json = JSON.parse(str)
        return this.JSONToDoc(json)
    }

    //expands the layer data into actual canvas objects
    JSONToDoc(json) {
        function layerToCanvas(layer) {
            return new Promise((res,rej) =>{
                let newLayer = {
                    type: layer.type,
                    title: layer.title,
                    width: layer.width,
                    height: layer.height,
                    visible: layer.visible,
                }
                const canvas = document.createElement('canvas')
                canvas.width = layer.width
                canvas.height = layer.height
                const img = new Image(layer.width, layer.height)
                img.onload = () => {
                    canvas.getContext('2d').drawImage(img, 0, 0)
                    newLayer.canvas = canvas
                    res(newLayer)
                }
                img.src = layer.data
            })
        }

        const doc = {
            id:json.id,
            title: json.title,
            width: json.width,
            height: json.height,
            layers: []
        }
        return Promise.all(json.layers.map(layer => layerToCanvas(layer))).then(layers=>{
            doc.layers = layers
            return doc
        })
    }

    //turns canvas objects into layer data
    DocToJSON(doc) {
        const d2 = {
            id:doc.id,
            title: doc.title,
            width: doc.width,
            height: doc.height,
        }
        d2.layers = doc.layers.map(layer => {
            return {
                type: layer.type,
                title: layer.title,
                width: layer.width,
                height: layer.height,
                visible: layer.visible,
                //no canvas
                data: layer.canvas.toDataURL('png')
            }
        })
        return d2
    }

    exportToPNGURL(doc) {
        return new Promise((res, rej) => {
            const canvas = document.createElement('canvas')
            const w = doc.width
            const h = doc.height
            canvas.width = w
            canvas.height = h
            console.log("exporting", w, h)
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, w, h)
            doc.layers.forEach(layer => {
                if(layer.visible) ctx.drawImage(layer.canvas, 0, 0)
            })
            let url = canvas.toDataURL()
            url = url.replace(/^data:image\/png/, 'data:application/octet-stream')
            res(url)
        })
    }
}
