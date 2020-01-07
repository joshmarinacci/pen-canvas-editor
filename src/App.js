import React, {useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {EditableLabel, HBox, Observer, Spacer, Toolbox, VBox} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {cloneCanvas, copyToCanvas, toDeg} from "./util";
import {Save, Download, ZoomIn, ZoomOut, Eye, EyeOff, PlusSquare} from "react-feather"
import {LayerWrapper} from "./layers";

// a button just showing a color, no textf
const ColorButton = ({color, caption, onClick, selected}) => {
  if(color.hue) {
    color =  `hsla(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%)`
  }
  const style = {
    backgroundColor:color,
    height:'2em',
    width:'2em',
    border:'1px solid black'
  }
  if(selected) {
    style.border = '3px solid white'
  }
  return <button onClick={onClick} style={style}/>
}

// sliders and hex input, 0-255 & hex output
const RGBPicker = () => {
  return <div>rgb picker</div>
}
// the N most recent colors
const RecentColors = ({colors, color, onSelect}) => {
  return <div style={{
  }}>
    {colors.map((c,i)=>{
      return <ColorButton key={i} color={c} onClick={()=>onSelect(c)} selected={color===c}/>
    })}
  </div>
};
// the list of customized pens
const pens = [
  {
    type:'pen',
    title:'giant',
    opacity:1.0,
    flow:0.5,
    color:0xFF0000,
    radius:50, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'fat',
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
    flow:0.5,
    color:0xFF0000,
    radius:5, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'thin',
    opacity: 1.0,
    flow: 0.5,
    color: 0x000000,
    radius:1.2, //in pixels
  },
  {
    type:'pen',
    title:'eraser',
    opacity: 1.0,
    flow: 1.0,
    color: 0x000000,
    radius: 10,
    blend:'erase',
  }
]

const dialogObserver = new Observer(null)

const DialogContainer = ({}) => {
  const [dialog,setDialog] = useState(dialogObserver.get())
  useEffect(()=>{
    const onChange = (val) => setDialog(val)
    dialogObserver.addEventListener(onChange)
    return () => dialogObserver.removeEventListener(onChange)
  })
  const style = {
    border:'1px solid red',
    position:'fixed',
    width:'100vw',
    height:'100vh',
    backgroundColor: 'rgba(255,255,255,0.9',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  }
  if(dialog === null) {
    style.display = 'none'
  }
  return <div style={style}>
    {dialog}
  </div>
}
const PopupContainer = ({}) => {
  const style = {
    display:"none"
  }
  return <div style={style}></div>
}

const DW = 1024
const DH = 1024

const doc = {
  title:"my first doc",
  width:DW,
  height:DH,
  layers: [
    {
      type:'layer',
      width:DW,
      height:DH,
      title:'bottom layer',
      visible:true,
      canvas: null,
      thumb:{
        width:64,
        height:64,
        canvas:null,
      }
    },
    {
      type:'layer',
      width:DW,
      height:DH,
      title:'middle layer',
      visible:true,
      canvas: null,
      thumb:{
        width:64,
        height:64,
        canvas:null,
      }
    },
    {
      type:'layer',
      width:DW,
      height:DH,
      title:'top layer',
      visible:true,
      canvas: null,
      thumb:{
        width:64,
        height:64,
        canvas:null,
      }
    }
  ]
}

function setupLayer(layer) {
  const can = document.createElement('canvas')
  const w = layer.width
  const h = layer.height

  can.width = w
  can.height = h

  const c = can.getContext('2d')
  c.save()
  c.fillStyle = 'rgba(255,255,255,0)'
  c.globalCompositeOperation = 'copy'
  c.fillRect(0,0,w,h)
  c.restore()

  layer.canvas = can

  const tcan = document.createElement('canvas')
  tcan.width = 64
  tcan.height = 64
  const c2 = tcan.getContext('2d')
  c2.drawImage(can,0,0,64,64)
  layer.thumb.canvas = c2
}

function setupDoc(doc) {
  doc.layers.forEach(layer => {
    setupLayer(layer)
  })
}
setupDoc(doc)

const storage = new Storage()
const docObserver = new Observer(doc)

const DocThumbnail = ({doc}) => {
  if(!doc || !doc.thumbnail) return <img width={64} height={64}/>
  return <img src={doc.thumbnail.data} width={doc.thumbnail.width} height={doc.thumbnail.height}/>
}
const ListDocsDialog = ({docs}) =>{
  return <ul>
    {docs.map((doc,i)=>{
      return <li key={i}><b>{doc.id}</b> <button onClick={()=>{
        storage.load(doc.id).then(doc => {
          dialogObserver.set(null)
          docObserver.set(doc)
        })
      }}>{doc.title}</button>
        <DocThumbnail doc={doc}/>
      </li>
    })}
    <li><button onClick={()=>dialogObserver.set(null)}>cancel</button></li>
  </ul>
}
const saveDoc = () => {
  storage.save(docObserver.get()).then(()=>{
    console.log("done saving",docObserver.get())
  })
}

const showLoadDocDialog = () => {
  storage.list().then(items => dialogObserver.set(<ListDocsDialog docs={items}/>))
}

function clearStorage() {
  storage.clear().then(()=>{
    console.log('everything is cleared')
  })
}

function exportPNG() {
  storage.exportToPNGURL(docObserver.get()).then((url)=>{
    const a = document.createElement('a')
    a.href = url
    a.download = docObserver.get().title + ".png"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })
}

function showPicker() {
  dialogObserver.set(<Dragger><HSLPicker/></Dragger>)
}

let undoBackup = null
let redoBackup = null

function App() {
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(docObserver.get())
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(pens[0])
  const [eraser,setEraser] = useState(pens.find(p => p.blend === 'erase'))
  const [layer,setLayer] = useState(doc.layers[0])
  const [zoom,setZoom] = useState(0)
  const [colors,setColors] = useState([{hue:0.4,sat:1.0,lit:0.5}])

  let layers = doc.layers.slice().reverse()

  useEffect(()=>{
    const onChange = (val)=> {
      setDoc(val)
      setLayer(val.layers[0])
    }
    docObserver.addEventListener(onChange)
    return ()=> docObserver.removeEventListener(onChange)
  })

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

  const undo = () => {
    redoBackup = cloneCanvas(layer.canvas)
    copyToCanvas(undoBackup,layer.canvas)
    undoBackup = null
    redraw()
  }
  const redo = () => {
    undoBackup = cloneCanvas(layer.canvas)
    copyToCanvas(redoBackup,layer.canvas)
    redoBackup = null
    redraw()
  }
  let onDrawDone = (before)=>{
    undoBackup = before
    redoBackup = null
    redraw()
  };
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
      <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color}/>
      <PenCanvas doc={doc} pen={pen} color={color} layer={layer} zoom={zoom} onPenDraw={onPenDraw} eraser={eraser} onDrawDone={onDrawDone}/>
      <LayerWrapper layers={layers} setLayer={setLayer} redraw={redraw} selectedLayer={layer}/>
      <Toolbox className="bottom-row full-width">
        <RecentColors colors={colors} onSelect={setColor} color={color}/>
      </Toolbox>
    <Dragger><HSLPicker color={color} onChange={setColor}/></Dragger>
    <DialogContainer/>
    <PopupContainer/>
  </div>
}

export default App;
