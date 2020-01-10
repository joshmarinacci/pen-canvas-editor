import React, {useEffect, useState} from 'react';
import './App.css';
import {Storage} from "./storage.js"
import {PenCanvas} from "./canvas.js"
import {EditableLabel, HBox, Observer, Spacer, Toolbox, VBox} from './util.js'
import {Dragger, HSLPicker} from './colors.js'
import {RecentPens} from './pens.js'
import {toDeg} from "./util";
import {Save, Download, ZoomIn, ZoomOut} from "react-feather"
import {Layer, LayerWrapper} from "./layers";
import {DH, DW} from "./common";
import {PenEditor} from "./pens";

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
const allPens = [
  {
    type:'pen',
    title:'giant',
    opacity:1.0,
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
    title:'thin',
    hardness:0.5,
    opacity: 1.0,
    flow: 0.5,
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

const dialogObserver = new Observer(null)

const DialogContainer = () => {
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
const PopupContainer = () => {
  const style = {
    display:"none"
  }
  return <div style={style}></div>
}


const doc = {
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
const docObserver = new Observer(doc)

const DocThumbnail = ({doc}) => {
  if(!doc || !doc.thumbnail) return <img width={64} height={64}/>
  return <img src={doc.thumbnail.data} width={doc.thumbnail.width} height={doc.thumbnail.height}/>
}
const ListDocsDialog = ({docs}) =>{
  return <VBox className={'dialog'}>
    <header>Open</header>
    <VBox className={'body'}>
      {docs.map((doc,i)=>{
        return <HBox key={i} className={"doc-entry"}
         onClick={()=>{
          storage.load(doc.id).then(doc => {
            dialogObserver.set(null)
            docObserver.set(doc)
          })
        }}>
            <label>{doc.title}</label>
            <DocThumbnail doc={doc}/>
        </HBox>
      })}
    </VBox>
    <footer>
      <Spacer/>
      <button onClick={()=>dialogObserver.set(null)}>cancel</button></footer>
  </VBox>
}

const DocStats = ({doc}) => {
  const tiles = doc.layers.reduce((acc,layer)=>{
    return acc + layer.getTileCount()
  },0)
  const filled = doc.layers.reduce((acc,layer)=>acc+layer.getFilledTileCount(),0)
  return <div style={{
    background:'white'
  }}>
    <p>layer count = {doc.layers.length}</p>
    <p>tile count = {tiles}</p>
    <p>filled tile count {filled}</p>
  </div>
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


let undoBackup = null
let redoBackup = null

function App() {
  const [pens,setPens] = useState(allPens)
  const [counter,setCounter] = useState(0)
  const [doc,setDoc] = useState(docObserver.get())
  const [color,setColor] = useState({hue:0,  sat:1.0, lit:0.5})
  const [pen,setPen] = useState(allPens[0])
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
  let closeBrushDialog = (newPen) => {
    setPens(pens.map((p)=>{
      if(p === pen) return newPen
      return p
    }))
    setPen(newPen)
    dialogObserver.set(null)
  }
  let showBrushDialog = ()=> dialogObserver.set(<PenEditor startPen={pen} onClose={closeBrushDialog}/>)

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
      <RecentPens pens={pens} selected={pen} onSelect={setPen} color={color} onEdit={showBrushDialog}/>
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
