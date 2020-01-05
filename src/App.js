import React, {useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {HBox, Observer, Toolbox, VBox} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {toDeg} from "./util";
import {Save, Download, ZoomIn, ZoomOut, Eye, EyeOff, PlusSquare} from "react-feather"

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
    flow:0.1,
    color:0xFF0000,
    radius:50, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'fat',
    opacity:1.0,
    flow:0.3,
    color:0xFF0000,
    radius:10, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'medium',
    opacity:1.0,
    flow:0.8,
    color:0xFF0000,
    radius:5, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'thin',
    opacity: 1.0,
    flow: 1.0,
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

function layerVisible(layer) {
  if(layer.visible) {
    return <Eye size={16}/>
  } else {
    return <EyeOff size={16}/>
  }
}
const penObserver = new Observer(pens[0])
// panel for a single Layer. no DnD for now.
const LayerView = ({layer,selected,onSelect, onToggle}) => {
  return <HBox style={{
    border: '1px solid black',
    borderWidth:'1px 0px 0 0px',
    minWidth:'200px',
    backgroundColor: selected===layer?'aqua':'white'
  }}
               onMouseDown={()=>onSelect(layer)}
  >
    <button className={"borderless"} style={{backgroundColor:'white'}} onClick={()=>{
      layer.visible = !layer.visible
      onToggle(layer)
    }}>{layerVisible(layer)}</button>
    <label>{layer.title}</label>
    {/*{layer.thumb.canvas}*/}
  </HBox>
}

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


//let ListView; // a vbox w/ scrolling and a toolbar of buttons to add
//let DraggablePanel; // small window in the dialog layer that you can drag around
//let Dialog; // standard dialog container w/ title, body, and action bar
//let DialogScrim; //scrim to block the background while dialog is visible
//let Popup; //standard popup container w/
//let PopupScrim; //scrim to block the background while popup is visible
//let PenCanvas; //a stack of Canvas objects that you can rotate, zoom, and pan w/ your fingers


const storage = new Storage()

const docObserver = new Observer(doc)

const saveDoc = () => {
  storage.save(docObserver.get()).then(()=>{
    console.log("done saving",docObserver.get())
  })
}
const showLoadDocDialog = () => {
  storage.list().then(items => {
    storage.load(items[0].id).then(doc => {
      console.log("loaded the doc",doc)
      docObserver.set(doc)
    })
  })
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
    a.download = 'layers.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })
}

function showPicker() {
  dialogObserver.set(<Dragger><HSLPicker/></Dragger>)
}

function App() {
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(docObserver.get())
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(pens[0])
  const [eraser,setEraser] = useState(pens.find(p => p.blend === 'erase'))
  const [layer,setLayer] = useState(doc.layers[0])
  const [zoom,setZoom] = useState(0)
  const [colors,setColors] = useState([{hue:0.4,sat:1.0,lit:0.5}])
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

  const Spacer = () => {
    return <div style={{flex:1}}></div>
  }

  let layers = doc.layers.slice().reverse()
  layers = layers.map((lay,i) => <LayerView key={i} layer={lay} doc={doc} selected={layer} onSelect={setLayer} onToggle={()=>setCounter(counter+1)}/>)
  const layerWrapper = <VBox className={'right-column second-row'}>{layers}
  <Toolbox>
    <button className="borderless"><PlusSquare size={20}/></button>
  </Toolbox>
  </VBox>
  return <div id={"main"}>
      <Toolbox className="top-row full-width">
        <button onClick={saveDoc} ><Save/></button>
        <button onClick={showLoadDocDialog}>open</button>
        <button onClick={clearStorage}>clear</button>
        <button onClick={exportPNG}><Download/></button>
        <Spacer/>
        <button onClick={zoomIn}><ZoomIn/></button>
        <button onClick={zoomOut}><ZoomOut/></button>
      </Toolbox>
      <label className="second-row">{doc.title}</label>
      <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color}/>
      <PenCanvas doc={doc} pen={pen} color={color} layer={layer} zoom={zoom} onPenDraw={onPenDraw} eraser={eraser}/>
      {layerWrapper}
      <Toolbox className="bottom-row full-width">
        <RecentColors colors={colors} onSelect={setColor} color={color}/>
      </Toolbox>
    <Dragger><HSLPicker color={color} onChange={setColor}/></Dragger>
    <DialogContainer/>
    <PopupContainer/>
  </div>
}

export default App;
