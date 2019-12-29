import React from 'react';
import logo from './logo.svg';
import './App.css';


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

let HBox;
let VBox;
let Toolbox; //a pretty toolbox hbox

let ColorButton; // a button just showing a color
let HSLPicker; // a triangle/ring HSL picker
let RGBPicker; // sliders and hex input, 0-255 & hex output
let RecentColors; // the N most recent colors
let RecentPens; // the list of customized pens
let PenEditor; // panel that shows settings for a pen, let you customize them
let LayerView; // panel for a single Layer. no DnD for now.
let ListView; // a vbox w/ scrolling and a toolbar of buttons to add

let DraggablePanel; // small window in the dialog layer that you can drag around
let Dialog; // standard dialog container w/ title, body, and action bar
let DialogScrim; //scrim to block the background while dialog is visible
let Popup; //standard popup container w/
let PopupScrim; //scrim to block the background while popup is visible

let CanvasWrapper; //scrolling container for the canvas
let PenCanvas; //a stack of Canvas objects that you can rotate, zoom, and pan w/ your fingers


// all methods return promises
//stored docs also have low res thumbnails embedded
class Storage {
  save(doc) {}
  list() {}
  load(docid) {} //loads the actual JSON to an object graph
  JSONToDoc() {} //expands the layer data into actual canvas objects
  DocToJSON() {} //turns canvas objects into layer data
}



const localStorage = new Storage()




function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
