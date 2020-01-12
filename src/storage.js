// all methods return promises
//stored docs also have low res thumbnails embedded

import React, {useContext, useState} from "react";
import {DialogContext, HBox, Spacer, VBox} from "./util";
import {Layer} from "./layers";

const PENS_STORAGE_KEY = "PENS_STORAGE_KEY"
export class Storage {

    async exportJSONURL(doc) {
        if(!doc.id) doc.id = `doc_${Math.floor(Math.random()*100000)}`
        const json = this.DocToJSON(doc)
        const str = JSON.stringify(json,null,'  ')
        return 'data:application/json;base64,'+btoa(str)
    }

    async save(doc) {
        if(!doc.id) doc.id = `doc_${Math.floor(Math.random()*100000)}`
        const json = this.DocToJSON(doc)
        const thumb = await this.exportToThumbURL(doc)
        const str = JSON.stringify(json)
        localStorage.setItem(json.id, str)
        const index = await this.list()
        let entry = index.find(d => d.id === json.id)
        if(!entry) {
            entry = {
                id: json.id,
                title: json.title,
            }
            index.push(entry)
        }
        entry.title = json.title
        entry.thumbnail = {
            width:64,
            height:64,
            data:thumb
        }

        localStorage.setItem('index',JSON.stringify(index))
        console.log("saved the index",index)
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
                let newLayer = new Layer(layer.width,layer.height,layer.title)
                newLayer.visible = layer.visible
                newLayer.loadTiles(layer.tiles).then(()=>  res(newLayer))
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
                tiles: layer.tilesToDataURLs('png')
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
            console.log("exporting", w, h, doc.title)
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, w, h)
            doc.layers.forEach(layer => {
                if(layer.visible) layer.drawSelf(ctx)
            })
            let url = canvas.toDataURL()
            url = url.replace(/^data:image\/png/, 'data:application/octet-stream')
            res(url)
        })
    }

    exportToThumbURL(doc) {
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
                if(layer.visible) layer.drawSelf(ctx)//ctx.drawImage(layer.canvas, 0, 0)
            })

            const canvas2 = document.createElement('canvas')
            const scale = Math.min(w/64, h/64)
            console.log("generating a thumb with the scale",scale)
            canvas2.width = w/scale
            canvas2.height = h/scale
            const ctx2 = canvas2.getContext('2d')
            ctx2.fillStyle = 'white'
            ctx2.fillRect(0,0,canvas2.width,canvas2.height)
            ctx2.scale(1/scale,1/scale)
            doc.layers.forEach(layer => {
                if(layer.visible) layer.drawSelf(ctx2)
            })
            let url = canvas2.toDataURL()
            res(url)
        })
    }

    async savePens(pens) {
        const str = JSON.stringify(pens)
        localStorage.setItem(PENS_STORAGE_KEY, str)
    }
    async loadPens() {
        const str = localStorage.getItem(PENS_STORAGE_KEY)
        if(str) return JSON.parse(str)
        throw new Error("no pens")
    }

}

const DocThumbnail = ({doc}) => {
    if(!doc || !doc.thumbnail) return <img width={64} height={64}/>
    return <img src={doc.thumbnail.data} width={doc.thumbnail.width} height={doc.thumbnail.height}/>
}

export const ListDocsDialog = ({docs, storage, setDoc}) =>{
    const dm = useContext(DialogContext)
    return <VBox className={'dialog'}>
        <header>Open</header>
        <VBox className={'body'}>
            {docs.map((doc,i)=>{
                return <HBox key={i} className={"doc-entry"}
                             onClick={()=>{
                                 storage.load(doc.id).then(doc => {
                                     dm.hide()
                                     setDoc(doc)
                                 })
                             }}>
                    <label>{doc.title}</label>
                    <DocThumbnail doc={doc}/>
                </HBox>
            })}
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>dm.hide()}>cancel</button></footer>
    </VBox>
}


export const UploadDocDialog = ({storage, setDoc}) => {
    const dm = useContext(DialogContext)
    const [error,setError] = useState(null)
    const changed = (e) => {
        console.log("files",e.target.files)
        for(let i=0; i<e.target.files.length; i++) {
            const file = e.target.files.item(i)
            console.log("loading the file",file)
            if(file.type !== 'application/json') {
                console.log("warning. not recognized as a JSON file")
            }
            const reader = new FileReader()
            reader.onload = () => {
                console.log("read the file as",reader.result)
                try {
                    const json = JSON.parse(reader.result)
                    console.log("read the doc json",json)
                    storage.JSONToDoc(json).then(doc=>{
                        console.log("read the doc",doc)
                        setDoc(doc)
                    })
                    dm.hide()
                } catch (err) {
                    console.log("error parsing",err)
                    setError("Couldn't parse the JSON file")
                }
            }
            reader.readAsText(file)
        }
    }
    return <VBox className={'dialog'}>
        <header>Open</header>
        <VBox className={'body'}>
            upload your file here
            <input type='file' onChange={changed}/>
            <div className={"error-panel " + ((error)?"visible":"hidden")}>{error?error:""}</div>
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>dm.hide()}>cancel</button>
        </footer>
    </VBox>
}