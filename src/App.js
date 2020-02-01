import React, {useContext, useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {EditableLabel, HBox, Observer, Spacer, Toolbox, VBox, DialogContext} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {Save, File, Folder, Download, Upload, ZoomIn, ZoomOut, Settings, RotateCcw, RotateCw} from "react-feather"
import {Layer, LayerWrapper} from "./layers";
import {DH, DW} from "./common";
import {RecentColors} from "./colors";
import {DialogContainer, DocStats, DownloadDialog, forceDownloadBlob, forceDownloadDataURL} from "./util";
import {ListDocsDialog, UploadDocDialog} from "./storage";
import {SettingsDialog} from "./settings";
import {DebugDialog} from "./debug";

// the list of customized pens
let allPens = [
  {
    type:'pen',
    title:'giant',
    opacity:0.5,
    hardness:0.0,
    flow:0.5,
    color:0xFF0000,
    radius:32, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'fat',
    hardness:0.5,
    opacity:1.0,
    flow:0.5,
    color:0xFF0000,
    radius:10, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'medium',
    opacity:1.0,
    hardness:0.5,
    flow:0.5,
    color:0xFF0000,
    radius:5, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'pencil',
    hardness:0.8,
    opacity: 0.5,
    flow: 0.2,
    color: 0x000000,
    radius:1.2, //in pixels
  },
  {
    type:'pen',
    title:'eraser',
    hardness:0.5,
    opacity: 1.0,
    flow: 1.0,
    color: 0x000000,
    radius: 10,
    blend:'erase',
  }
]

const PopupContainer = () => {
  const style = {
    display:"none"
  }
  return <div style={style}></div>
}

function makeNewDoc() {
  const realDoc = {
    title: "my first doc",
    width: DW,
    height: DH,
    layers: [
      new Layer(DW, DH, 'bottom layer'),
      new Layer(DW, DH, 'middle layer'),
      new Layer(DW, DH, 'top layer'),
    ],
    colors: [
        {hue:1.0,sat:1.0,lit:0.5}
    ]
  }
  return realDoc
}

const storage = new Storage()

const ZoomControls = ({zoom, setZoom}) => {
  const zoomIn = ()=> (zoom<3)?setZoom(zoom+0.5):''
  const zoomOut = ()=> (zoom>-3)?setZoom(zoom-0.5):''
  return [
      <button key="zoomin" onClick={zoomIn}><ZoomIn/></button>,
      <label key="label">{(Math.pow(2,zoom)*100).toFixed(1)}%</label>,
      <button key="zoomout" onClick={zoomOut}><ZoomOut/></button>,
    ]
}
const FileControls = ({storage,doc,setDoc,colors,setColors,setLayer, setDirty}) => {
  const dm = useContext(DialogContext)

  const saveDoc = () => storage.save(doc,colors).then(()=> setDirty(false))

  const showLoadDocDialog = () => {
    saveDoc().then(()=>{
      return storage.list()
          .then(items => dm.show(<ListDocsDialog docs={items} storage={storage} setDoc={(doc)=>{
        setDoc(doc)
        setLayer(doc.layers[0])
        setColors(doc.colors)
      }}/>))
    })
  }
  const newDoc = () => {
    saveDoc().then(()=>{
      const doc = makeNewDoc()
      setDoc(doc)
      setLayer(doc.layers[0])
      setColors(doc.colors)
    })
  }

  const saveJSON = () => {
    const name = (doc.title+'.peneditor.json').replace(' ','_')
    storage
        .exportJSONURL(doc,colors)
        .then(url => forceDownloadDataURL(name,url))
  }
  const uploadJSON = () => dm.show(<UploadDocDialog storage={storage} setDoc={setDoc}/>)
  const exportPNG = (e) => storage.docToPNGBlob(doc).then((blob)=>  forceDownloadBlob(doc.title+'.png',blob))
  return [
    <button key="save" onClick={saveDoc} ><Save/></button>,
    <button key="list" onClick={showLoadDocDialog}><Folder/></button>,
    <button key="new" onClick={newDoc}><File/></button>,
    <button key="png" onClick={exportPNG}><Download/>PNG</button>,
    <button key="jsondown" onClick={saveJSON}><Download/>JSON</button>,
    <button key="jsonup" onClick={uploadJSON}><Upload/>JSON</button>,
    ]
}

class UndoBuffer {
  constructor() {
    this.stack = []
    this.current = 0
    this.listeners = []
  }
  on(cb) {
    this.listeners.push(cb)
  }
  off(cb) {
    this.listeners = this.listeners.filter(c => c !== cb)
  }
  canUndo() {
    if(this.current > 0) return true
    return false
  }
  canRedo() {
    if(this.current < this.stack.length) return true
    return false
  }
  add(layer) {
    console.log("adding a layer to the undo buffer",layer)
    console.log("current",this.current,'length',this.stack.length)
    this.stack = this.stack.slice(0,this.current)
    this.stack.push(layer)
    this.current++
    this.listeners.forEach(cb => cb(this))
  }
  performUndo(doc) {
    console.log("performing the undo")
    const c = this.stack[this.current-1]
    console.log("looking at",c)
    console.log("doc is",doc)
    doc.layers.forEach(l => {
      if(l.id === c.prevId) l.copyFrom(c)
    })
    this.current--
    console.log("current",this.current,'length',this.stack.length)
    this.listeners.forEach(cb => cb(this))
  }

  performRedo(doc) {
    console.log("performing the redo")
    const c = this.stack[this.current]
    console.log("looking at",c)
    console.log("doc is",doc)
    //splice it in
    doc.layers.forEach(l => {
      if(l.id === c.prevId) l.copyFrom(c)
    })
    this.current++
    console.log("current",this.current,'length',this.stack.length)
    this.listeners.forEach(cb => cb(this))
  }
}

const undoBuffer = new UndoBuffer()

const UndoRedoControls = ({buffer, doc, redraw}) => {
  const undo = () => {
    buffer.performUndo(doc)
    redraw()
  }
  const redo = () => {
    buffer.performRedo(doc)
    redraw()
  }
  useEffect(()=>{
    const update = (buffer) => {
      console.log("updated",buffer.current,buffer.stack)
    }
    buffer.on(update)
    return ()=>buffer.off(update)
  })
  return [
    <button key="undo" onClick={undo} disabled={!buffer.canUndo()}><RotateCcw/></button>,
    <button key="redo" onClick={redo} disabled={!buffer.canRedo()}><RotateCw/></button>,
    ]
}

function App() {
  const [first,setFirst] = useState(true)
  const [pens,setPens] = useState(allPens)
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(makeNewDoc())
  const [dirty,setDirty] = useState(false)
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(allPens[0])
  const [eraser,setEraser] = useState(pens.find(p => p.blend === 'erase'))
  const [layer,setLayer] = useState(doc.layers[0])
  const [zoom,setZoom] = useState(0)
  const [colors,setColors] = useState(doc.colors)

  let layers = doc.layers.slice().reverse()
  const dm = useContext(DialogContext)


  if(first) {
    storage.loadPens()
        .then(pens => {
          if(pens) {
            setPens(pens)
            setPen(pens[0])
          }
        })
    setFirst(false)
  }
  const onPenDraw = () =>{
    doc.layers.forEach(l => l.freeze())
    setDirty(true)
    const existing = colors.find(c => c.hue === color.hue && c.sat === color.sat && c.lit === color.lit)
    if(!existing) {
      let c2 = colors.slice()
      c2.push(color)
      setColors(c2)
    }
  }

  const redraw = ()=>setCounter(counter+1)
  const addLayer = () => {
    doc.layers.push(new Layer(doc.width,doc.height,'new layer'))
    redraw()
  }

  const moveLayerUp = (layer) => {
    const n = doc.layers.indexOf(layer)
    if(n <= 0) return
    doc.layers.splice(n,1)
    doc.layers.splice(n-1,0,layer)
    redraw()
  }
  const moveLayerDown = () => {
    const n = doc.layers.indexOf(layer)
    if(n < 0) return
    if(n >= doc.layers.length) return
    doc.layers.splice(n,1)
    doc.layers.splice(n+1,0,layer)
    redraw()
  }

  let onDrawDone = (beforeLayer)=>{
    undoBuffer.add(beforeLayer)
    redraw()
  };
  const updatePenSettings = (newPen) => {
    let newPens = pens.map((p)=>{
      if(p === pen) return newPen
      return p
    })
    setPens(newPens)
    setPen(newPen)
    storage.savePens(newPens).then(()=>console.log("saved the pens"))
  }

  useEffect(()=>{
    const id = setInterval(()=>{
      if(dirty) {
        storage.save(doc,colors).then(()=> setDirty(false))
        console.log("auto saved")
      }
    },60*1000) //save every minute
    return ()=>clearInterval(id)
  })

  return <div id={"main"}>
        <Toolbox className="top-row full-width">
          <FileControls storage={storage} doc={doc} setDoc={setDoc} colors={colors} setColors={setColors} setLayer={setLayer} setDirty={setDirty}/>
          <Spacer/>
          <UndoRedoControls doc={doc} redraw={redraw} buffer={undoBuffer}/>
          <ZoomControls zoom={zoom} setZoom={setZoom}/>
          <Spacer/>
          <button onClick={()=>dm.show(<SettingsDialog storage={storage}/>)}><Settings/></button>
        </Toolbox>
        <EditableLabel className="second-row" initialValue={doc.title} onDoneEditing={(value)=>{
          doc.title = value
          storage.save(doc,colors).then(()=> setDirty(false))
        }}/>
        <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color} onEdit={updatePenSettings}/>
        <PenCanvas doc={doc} pen={pen} color={color} layer={layer} zoom={zoom} onPenDraw={onPenDraw} eraser={eraser} onDrawDone={onDrawDone}/>
        <LayerWrapper layers={layers} setLayer={setLayer} redraw={redraw} selectedLayer={layer} addLayer={addLayer} moveLayerUp={moveLayerUp} moveLayerDown={moveLayerDown}/>
        <Toolbox className="bottom-row full-width">
          <RecentColors colors={colors} onSelect={setColor} color={color}/>
          <Spacer/>
          {dirty?"*":""}
          <button onClick={()=>dm.show(<DebugDialog pen={pen}/>)}>&Pi;</button>
        </Toolbox>
        <HSLPicker color={color} onChange={setColor}/>
      <Dragger title="debug" x={600} y={400}><DocStats doc={doc}/></Dragger>
      <DialogContainer/>
      <PopupContainer/>
  </div>
}

export default App;
