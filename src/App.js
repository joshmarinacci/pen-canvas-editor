import React, {useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"

const HBox = (props) => {
  const {style, ...rest} = props

  const styles = {
    display:'flex',
    flexDirection:'row',
    ...style
  }
  if(props.grow) styles.flex = '1.0'
  return <div style={styles}>{props.children}</div>
}
const VBox = (props) => {
  const {style, ...rest} = props
  const styles = {
    display:'flex',
    flexDirection:'column',
        ...style
  }
  if(props.grow) styles.flex = '1.0'
  return <div style={styles} {...rest}>{props.children}</div>
}
//an hbox with a border
const Toolbox = (props) => {
  const style = {
  //  border: '1px solid black'
  }
  return <HBox  style={style} {...props}/>
}
// a button just showing a color, no text
const ColorButton = ({color, caption}) => {
  const style = {
    backgroundColor:color,
    height:'1em',
    width:'1em',
  }
  return <button style={style}/>
}
// a triangle/ring HSL picker
const HSLPicker = () => {
  return <div>hsl picker</div>
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
const RecentPens = () => {
  return <VBox style={{
    minWidth:'100px',
    border:'1px solid black',
  }}>some pens</VBox>
};
// panel that shows settings for a pen, let you customize them
const PenEditor = () => {
  return <div> edit the pen</div>
};
// panel for a single Layer. no DnD for now.
const LayerView = ({layer}) => {
  return <HBox style={{
    border: '1px solid black',
    borderWidth:'1px 0px 0 0px',
    minWidth:'200px'
  }}>
    <label>title</label>
    <button>v</button>
    {/*{layer.thumb.canvas}*/}
    <label>thumbnail</label>
  </HBox>
}

const DialogContainer = ({}) => {
  const style = {
    display:"none"
  }
  return <div style={style}></div>
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
  ]
}

function setupDoc(doc) {
  const can = document.createElement('canvas')
  const w = 500
  const h = 500

  can.width = w
  can.height = h

  const c = can.getContext('2d')
  c.fillStyle = 'red'
  c.fillRect(0,0,w,h)
  c.fillStyle = 'white'
  c.fillRect(w/4,h/4,w/2,h/2)

  doc.layers[0].canvas = can

  const tcan = document.createElement('canvas')
  tcan.width = 64
  tcan.height = 64
  const c2 = tcan.getContext('2d')
  c2.drawImage(can,0,0,64,64)
  doc.layers[0].thumb.canvas = c2
}
setupDoc(doc)

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

//let ListView; // a vbox w/ scrolling and a toolbar of buttons to add
//let DraggablePanel; // small window in the dialog layer that you can drag around
//let Dialog; // standard dialog container w/ title, body, and action bar
//let DialogScrim; //scrim to block the background while dialog is visible
//let Popup; //standard popup container w/
//let PopupScrim; //scrim to block the background while popup is visible
//let PenCanvas; //a stack of Canvas objects that you can rotate, zoom, and pan w/ your fingers


const storage = new Storage()

class Observer {
  constructor(value) {
    this.cbs = []
    this.value = value
  }
  addEventListener(cb) {
    this.cbs.push(cb)
  }
  removeEventListener(cb) {
    this.cbs = this.cbs.filter(c => c!==cb)
  }
  get() { return this.value }
  set(value) {
    this.value = value
    this.notify(this.value)
  }
  notify(e) {
    this.cbs.forEach(cb=>cb(e))
  }
}
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

function App() {
  const [doc,setDoc] = useState(docObserver.get())
  useEffect(()=>{
    const onChange = (val)=> setDoc(val)
    docObserver.addEventListener(onChange)
    return ()=> docObserver.removeEventListener(onChange)
  })
  const layers = doc.layers.map((layer,i) => <LayerView key={i} layer={layer} doc={doc}/>)
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
        <RecentPens/>
        <PenCanvas doc={doc} grow/>
        {layerWrapper}
      </HBox>
      <Toolbox>
        <RecentColors/>
        <button>pick</button>
      </Toolbox>
    </VBox>
    <DialogContainer/>
    <PopupContainer/>
  </div>
}

export default App;
