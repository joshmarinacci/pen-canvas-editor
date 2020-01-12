import React, {useContext, useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {EditableLabel, HBox, Observer, Spacer, Toolbox, VBox, DialogContext} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {Save, File, Download, Upload, ZoomIn, ZoomOut, Settings} from "react-feather"
import {Layer, LayerWrapper} from "./layers";
import {DH, DW} from "./common";
import {RecentColors} from "./colors";
import {DialogContainer, DocStats, DownloadDialog, forceDownloadBlob, forceDownloadDataURL} from "./util";
import {ListDocsDialog, UploadDocDialog} from "./storage";
import {SettingsDialog} from "./settings";

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


let undoBackup = null
let redoBackup = null

function App() {
  const [first,setFirst] = useState(true)
  const [pens,setPens] = useState(allPens)
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(makeNewDoc())
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(allPens[0])
  const [eraser,setEraser] = useState(pens.find(p => p.blend === 'erase'))
  const [layer,setLayer] = useState(doc.layers[0])
  const [zoom,setZoom] = useState(0)
  const [colors,setColors] = useState(doc.colors)

  let layers = doc.layers.slice().reverse()


  if(first) {
    storage.loadPens()
        .then(pens => setPens(pens))
        .catch(()=>{ console.log("pens not saved yet. using default pens")  })
    setFirst(false)
  }
  const onPenDraw = () =>{
    const existing = colors.find(c => c.hue === color.hue && c.sat === color.sat && c.lit === color.lit)
    if(!existing) {
      let c2 = colors.slice()
      c2.push(color)
      setColors(c2)
    }
  }

  const zoomIn = ()=> {
    if(zoom < 3) setZoom(zoom+1)
  }
  const zoomOut = ()=>{
    if(zoom > -3) setZoom(zoom-1)
  }

  const redraw = ()=>setCounter(counter+1)
  const dm = useContext(DialogContext)
  const showLoadDocDialog = () => {
    storage.list().then(items => dm.show(<ListDocsDialog docs={items} storage={storage} setDoc={(doc)=>{
      setDoc(doc)
      setLayer(doc.layers[0])
      setColors(doc.colors)
    }}/>))
  }
  const showSettings = () => dm.show(<SettingsDialog storage={storage}/>)
  const saveDoc = () => storage.save(doc,colors).then(()=> console.log("done saving",doc))
  const newDoc = () => {
    const doc = makeNewDoc()
    setDoc(doc)
    setLayer(doc.layers[0])
    setColors(doc.colors)
  }

  const saveJSON = () => {
    const name = (doc.title+'.peneditor.json').replace(' ','_')
    storage
        .exportJSONURL(doc,colors)
        .then(url => forceDownloadDataURL(name,url))
  }
  const uploadJSON = () => dm.show(<UploadDocDialog storage={storage} setDoc={setDoc}/>)
  const showDownloadDialog = (name,url) => dm.show(<DownloadDialog name={name} url={url}/>)
  const exportPNG = (e) => storage.docToPNGBlob(doc).then((blob)=>  forceDownloadBlob(doc.title+'.png',blob))

  const undo = () => {
    redoBackup = layer.makeClone()
    layer.clear()
    layer.drawLayer(undoBackup)
    undoBackup = null
    redraw()
  }
  const redo = () => {
    undoBackup = layer.makeClone()
    layer.clear()
    layer.drawLayer(redoBackup)
    redoBackup = null
    redraw()
  }
  let onDrawDone = (before)=>{
    undoBackup = before
    redoBackup = null
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

  return <div id={"main"}>
        <Toolbox className="top-row full-width">
          <button onClick={showSettings}><Settings/></button>
          <button onClick={saveDoc} ><Save/></button>
          <button onClick={showLoadDocDialog}>open</button>
          <button onClick={newDoc}><File/></button>
          <button onClick={exportPNG}><Download/>PNG</button>
          <button onClick={saveJSON}><Download/>JSON</button>
          <button onClick={uploadJSON}><Upload/>JSON</button>
          <Spacer/>
          <button onClick={undo} disabled={undoBackup === null}>undo</button>
          <button onClick={redo} disabled={redoBackup === null}>redo</button>
          <Spacer/>
          <button onClick={zoomIn}><ZoomIn/></button>
          <label>{Math.pow(2,zoom)*100}%</label>
          <button onClick={zoomOut}><ZoomOut/></button>
        </Toolbox>
        <EditableLabel className="second-row" initialValue={doc.title} onDoneEditing={(value)=>doc.title = value}/>
        <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color} onEdit={updatePenSettings}/>
        <PenCanvas doc={doc} pen={pen} color={color} layer={layer} zoom={zoom} onPenDraw={onPenDraw} eraser={eraser} onDrawDone={onDrawDone}/>
        <LayerWrapper layers={layers} setLayer={setLayer} redraw={redraw} selectedLayer={layer}/>
        <Toolbox className="bottom-row full-width">
          <RecentColors colors={colors} onSelect={setColor} color={color}/>
        </Toolbox>
      <Dragger title="HSL Color" x={600} y={100}><HSLPicker color={color} onChange={setColor}/></Dragger>
      <Dragger title="debug" x={600} y={400}><DocStats doc={doc}/></Dragger>
      <DialogContainer/>
      <PopupContainer/>
  </div>
}

export default App;
