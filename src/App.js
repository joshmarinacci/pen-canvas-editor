import React from 'react';
import './App.css';
import {Storage} from "./storage.js"

const HBox = (props) => {
  const styles = {display:'flex', flexDirection:'row'}
  if(props.grow) {
    styles.flex = '1.0'
  }
  return <div style={styles}>{props.children}</div>
}
const VBox = (props) => {
  const styles = {display:'flex', flexDirection:'column'}
  if(props.grow) {
    styles.flex = '1.0'
  }
  return <div style={styles}>{props.children}</div>
}

const Toolbox = (props) => {
  const {style, ...rest} = props
  style.border = '1px solid black'
  return <HBox  style={style} ...rest/>
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
const HSLPicker = () => {
  return <div>hsl picker</div>
}

// the N most recent colors
const RecentColors = () => {
  return <div>some colors</div>
};

// the list of customized pens
const RecentPens = () => {
  return <div>some pens</div>
};

// panel that shows settings for a pen, let you customize them
const PenEditor = () => {
  return <div> edit the pen</div>
};

// panel for a single Layer. no DnD for now.
const LayerView = () => {
  return <HBox>
    <label>title</label>
    <button>toggle visible</button>
    <label>thumbnail</label>
  </HBox>
}



const doc = {
  title:"my first doc",
  width:1024,
  height:1024,
  layers: [
    {
      type:'layer',
      width:1024,
      height:1024,
      title:'top layer',
      visible:true,
      data:'b64data',
      thumb:{
        width:64,
        height:64,
        data:''
      }
    },
    {
      type:'layer',
      width:1024,
      height:1024,
      title:'base layer',
      visible:true,
      data:'b64data',
      thumb:{
        width:64,
        height:64,
        data:''
      }
    },
    {
      type:'color-layer',
      title:'background',
      visible:true,
      color:'#ffffff',
      thumb:{
        width:64,
        height:64,
        data:''
      }
    },
  ]
}

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

let ListView; // a vbox w/ scrolling and a toolbar of buttons to add

let DraggablePanel; // small window in the dialog layer that you can drag around
let Dialog; // standard dialog container w/ title, body, and action bar
let DialogScrim; //scrim to block the background while dialog is visible
let Popup; //standard popup container w/
let PopupScrim; //scrim to block the background while popup is visible

let PenCanvas; //a stack of Canvas objects that you can rotate, zoom, and pan w/ your fingers


const localStorage = new Storage()

const saveDoc = () => {
  console.log("saving")
}
const showLoadDocDialog = () => {
  console.log("showing the load dialog")
}

function App() {
  const layers = doc.layers.map((layer,i) => <LayerView key={i} layer={layer} doc={doc}/>)
  const layerWrapper = <VBox>{layers}
  <Toolbox>
    <button>add</button>
  </Toolbox>
  </VBox>
  return <div>
    <VBox>
      <Toolbox>
        <button onClick={saveDoc}>save</button>
        <button onClick={showLoadDocDialog}>open</button>
      </Toolbox>
      <HBox grow>
        <RecentPens/>
        <PenCanvas doc={doc} grow/>
        {layerWrapper}
      </HBox>
      <HBox>
        <RecentColors/>
        <button>pick</button>
      </HBox>
    </VBox>
    <DialogContainer/>
    <PopupContainer/>
  </div>
}

export default App;
