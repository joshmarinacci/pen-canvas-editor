import React, {useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {HBox, Observer, Toolbox, VBox} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'

// a button just showing a color, no textf
const ColorButton = ({color, caption}) => {
  const style = {
    backgroundColor:color,
    height:'1em',
    width:'1em',
  }
  return <button style={style}/>
}

// sliders and hex input, 0-255 & hex output
const RGBPicker = () => {
  return <div>rgb picker</div>
}
// the N most recent colors
const RecentColors = () => {
  return <div>some colors</div>
};
// the list of customized pens
const pens = [
  {
    type:'pen',
    title:'marker',
    opacity:0.5,
    flow:0.8,
    color:0xFF0000,
    radius:10.8, //in pixels
    blend:'overlay',
  },
  {
    type:'pen',
    title:'pencil',
    opacity: 0.3,
    flow: 1.0,
    color: 0x000000,
    radius:1, //in pixels
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

const penObserver = new Observer(pens[0])
// panel for a single Layer. no DnD for now.
const LayerView = ({layer,selected,onSelect}) => {
  return <HBox style={{
    border: '1px solid black',
    borderWidth:'1px 0px 0 0px',
    minWidth:'200px',
    backgroundColor: selected===layer?'aqua':'white'
  }}>
    <button onClick={()=>onSelect(layer)}>u</button>
    <label>{layer.title}</label>
    {/*<button>v</button>*/}
    {/*{layer.thumb.canvas}*/}
    {/*<label>thumbnail</label>*/}
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

const doc = {
  title:"my first doc",
  width:500,
  height:500,
  layers: [
    {
      type:'layer',
      width:500,
      height:500,
      title:'top layer',
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
      width:500,
      height:500,
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
      width:500,
      height:500,
      title:'bottom layer',
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
  const w = 500
  const h = 500

  can.width = w
  can.height = h

  const c = can.getContext('2d')
  c.clearRect(0,0,w,h)

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
  const [doc,setDoc] = useState(docObserver.get())
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(pens[0])
  const [layer,setLayer] = useState(doc.layers[0])
  useEffect(()=>{
    const onChange = (val)=> setDoc(val)
    docObserver.addEventListener(onChange)
    return ()=> docObserver.removeEventListener(onChange)
  })
  const layers = doc.layers.map((lay,i) => <LayerView key={i} layer={lay} doc={doc} selected={layer} onSelect={setLayer}/>)
  const layerWrapper = <VBox style={{
    width:'200px',
    border:'0px solid red'
  }}>{layers}
  <Toolbox>
    <button>add</button>
  </Toolbox>
  </VBox>
  return <div style={{
    position:'fixed',
    width:'100%',
    height:'100%',
    display:'flex',
    flexDirection:'row'
  }}>
    <VBox grow>
      <Toolbox>
        <button onClick={saveDoc}>save</button>
        <button onClick={showLoadDocDialog}>open</button>
        <button onClick={clearStorage}>clear</button>
        <button onClick={exportPNG}>png</button>
      </Toolbox>
      <label>{doc.title}</label>
      <HBox grow>
        <RecentPens pens={pens} onChange={setPen}/>
        <PenCanvas doc={doc} pen={pen} color={color} layer={layer} grow/>
        {layerWrapper}
      </HBox>
      <Toolbox>
        <RecentColors/>
        {/*<button onClick={showPicker}>pick</button>*/}
      </Toolbox>
    </VBox>
    <Dragger><HSLPicker color={color} onChange={setColor}/></Dragger>
    <DialogContainer/>
    <PopupContainer/>
  </div>
}

export default App;
