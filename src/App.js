import React, {useContext, useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {EditableLabel, HBox, Observer, Spacer, Toolbox, VBox, DialogContext} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {Save, Download, ZoomIn, ZoomOut} from "react-feather"
import {Layer, LayerWrapper} from "./layers";
import {DH, DW} from "./common";
import {RecentColors} from "./colors";
import {DialogContainer, DocStats} from "./util";
import {ListDocsDialog} from "./storage";

// the list of customized pens
const allPens = [
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


const realDoc = {
  title:"my first doc",
  width:DW,
  height:DH,
  layers: [
    new Layer(DW,DH,'bottom layer'),
    new Layer(DW,DH,'middle layer'),
    new Layer(DW,DH,'top layer'),
  ]
}

const storage = new Storage()


let undoBackup = null
let redoBackup = null

function App() {
  const [pens,setPens] = useState(allPens)
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(realDoc)
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(allPens[0])
  const [eraser,setEraser] = useState(pens.find(p => p.blend === 'erase'))
  const [layer,setLayer] = useState(doc.layers[0])
  const [zoom,setZoom] = useState(0)
  const [colors,setColors] = useState([{hue:0.4,sat:1.0,lit:0.5}])

  let layers = doc.layers.slice().reverse()


  const onPenDraw = () =>{
    const existing = colors.find(c => c.hue === color.hue && c.sat === color.sat && c.lit === color.lit)
    if(!existing) {
      let c2 = colors.slice()
      c2.push(color)
      setColors(c2)
    }
  }

  const zoomIn = ()=>{
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
    }}/>))
  }
  const saveDoc = () => {
    storage.save(doc).then(()=>{
      console.log("done saving",doc)
    })
  }
  const clearStorage = () => {
    storage.clear().then(()=>{
      console.log('everything is cleared')
    })
  }
  const exportPNG = () => {
    storage.exportToPNGURL(doc).then((url)=>{
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title + ".png"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }

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
    setPens(pens.map((p)=>{
      if(p === pen) return newPen
      return p
    }))
    setPen(newPen)
  }

  return <div id={"main"}>
        <Toolbox className="top-row full-width">
          <button onClick={saveDoc} ><Save/></button>
          <button onClick={showLoadDocDialog}>open</button>
          <button onClick={clearStorage}>clear</button>
          <button onClick={exportPNG}><Download/></button>
          <Spacer/>
          <button onClick={undo} disabled={undoBackup === null}>undo</button>
          <button onClick={redo} disabled={redoBackup === null}>redo</button>
          <Spacer/>
          <button onClick={zoomIn}><ZoomIn/></button>
          <button onClick={zoomOut}><ZoomOut/></button>
        </Toolbox>
        <EditableLabel className="second-row" initialValue={doc.title} onDoneEditing={(value)=>doc.title = value}/>
        <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color} onEdit={updatePenSettings}/>
        <PenCanvas doc={doc} pen={pen} color={color} layer={layer} zoom={zoom} onPenDraw={onPenDraw} eraser={eraser} onDrawDone={onDrawDone}/>
        <LayerWrapper layers={layers} setLayer={setLayer} redraw={redraw} selectedLayer={layer}/>
        <Toolbox className="bottom-row full-width">
          <RecentColors colors={colors} onSelect={setColor} color={color}/>
        </Toolbox>
      <Dragger x={600} y={100}><HSLPicker color={color} onChange={setColor}/></Dragger>
      <Dragger x={600} y={400}><DocStats doc={doc}/></Dragger>
      <DialogContainer/>
      <PopupContainer/>
  </div>
}

export default App;
