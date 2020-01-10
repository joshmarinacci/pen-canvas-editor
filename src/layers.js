import {Eye, EyeOff, PlusSquare} from "react-feather";
import {HBox, Toolbox, VBox} from "./util";
import React from "react";
import {EditableLabel} from './util.js'


const TILE_SIZE = 256

class Tile {
    constructor(size) {
        this.size = size
        this.canvas = null
    }
    empty() {
        return this.canvas === null
    }
    clear() {
        if(this.canvas) {
            const c = this.canvas.getContext('2d')
            c.save()
            c.fillStyle = 'rgba(255,255,255,0)'
            c.globalCompositeOperation = 'copy'
            c.fillRect(0, 0, this.size,this.size)
            c.restore()
        }
    }
    initCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.size
        this.canvas.height = this.size
        const c = this.canvas.getContext('2d')
        c.save()
        c.fillStyle = 'rgba(255,255,255,0)'
        c.globalCompositeOperation = 'copy'
        c.fillRect(0,0,this.size,this.size)
        c.restore()
        return this.canvas
    }
    getCanvas() {
        if(!this.canvas) this.initCanvas()
        return this.canvas
    }
}
export class Layer {
    constructor(w,h,title) {
        this.type = 'layer'
        this.visible = true

        this.width = w
        this.height = h
        this.tiles = []
        let tw = Math.ceil(this.width/TILE_SIZE)
        let th = Math.ceil(this.height/TILE_SIZE)
        for(let i=0;i<tw;i++) {
            this.tiles[i] = []
            for(let j=0;j<th;j++) {
                this.tiles[i][j] = new Tile(TILE_SIZE)
            }
        }
        this.title = title
        this.forAllTiles(tile => tile.clear())
    }
    getTileCount() {
        return this.tiles.length * this.tiles[0].length
    }
    getFilledTileCount() {
        let total = 0
        this.forAllTiles(t => total += t.empty()?0:1)
        return total
    }

    forAllTiles(cb) {
        for(let i=0; i<this.tiles.length; i++) {
            let row = this.tiles[i]
            for(let j=0; j<row.length; j++) {
                cb(this.tiles[i][j],i,j)
            }
        }
    }

    debugRect(color,x,y,w,h) {
        this.forAllTiles((t,i,j)=>{
            const c = t.getCanvas().getContext('2d')
            c.fillStyle = color
            c.fillRect(x-i*TILE_SIZE,y-j*TILE_SIZE,w,h)
        })
    }

    stamp(brush,x,y,flow,opacity,blend){
        //calculate the minimum tiles needed for the brush
        let sx = Math.floor(x/TILE_SIZE)
        let sy = Math.floor(y/TILE_SIZE)
        let ex = Math.floor((x+brush.width)/TILE_SIZE)+1
        let ey = Math.floor((y+brush.height)/TILE_SIZE)+1
        // console.log(`drawing ${sx}-${ex} ${sy}-${ey}  for ${x},${y}`)
        //make sure indexes are valid
        sx = Math.max(sx,0)
        sy = Math.max(sy,0)
        ex = Math.min(ex,this.tiles.length)
        ey = Math.min(ey,this.tiles[0].length)
        //stamp onto the selected tiles
        for(let i=sx; i<ex; i++) {
            for(let j=sy;j<ey;j++) {
                let t = this.tiles[i][j]
                const ctx = t.getCanvas().getContext('2d')
                ctx.save()
                ctx.globalAlpha = flow
                ctx.globalCompositeOperation = blend
                ctx.drawImage(brush,x-i*TILE_SIZE,y-j*TILE_SIZE,brush.width,brush.height)
                ctx.restore()
            }
        }
    }
    clear() {
        this.forAllTiles(t => t.clear())
    }
    drawSelf(c) {
        this.forAllTiles((t,i,j) => {
            if(t.empty()) return
            c.save()
            c.translate(i*TILE_SIZE, j*TILE_SIZE)
            c.drawImage(t.getCanvas(),0,0)
            c.fillStyle = 'green'
            c.strokeStyle = 'green'
            c.strokeRect(5,5,t.size-5,t.size-5)
            c.restore()
        })
    }
    drawLayer(layer, opacity=1.0, blend='src-atop') {
        layer.forAllTiles((srcTile,i,j) => {
            if(srcTile.empty()) return
            const dstTile = this.tiles[i][j]
            const c = dstTile.getCanvas().getContext('2d')
            c.save()
            c.globalAlpha = opacity
            c.globalCompositeOperation = blend
            c.drawImage(srcTile.getCanvas(),0,0)
            c.fillStyle = 'green'
            c.strokeStyle = 'green'
            c.strokeRect(5,5,dstTile.size-5,dstTile.size-5)
            c.restore()
        })
    }

    makeClone() {
        const layer = new Layer(this.width,this.height,this.title+'-clone')
        layer.drawLayer(this)
        return layer
    }
}

function layerVisible(layer) {
    if(layer.visible) {
        return <Eye size={16}/>
    } else {
        return <EyeOff size={16}/>
    }
}


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
        <button className={"borderless"} style={{backgroundColor:'transparent'}}
            onMouseDown={(e)=>{
                e.preventDefault()
                e.stopPropagation()
            }}
                onClick={()=>{
            layer.visible = !layer.visible
            onToggle(layer)
        }}>{layerVisible(layer)}</button>
        <EditableLabel initialValue={layer.title} onDoneEditing={(v)=>{
            layer.title = v
            onSelect(layer)
        }}/>
        {/*{layer.thumb.canvas}*/}
    </HBox>
}

export const LayerWrapper = ({layers, selectedLayer, setLayer, redraw}) => {
    layers = layers.map((lay,i) => <LayerView key={i} layer={lay} selected={selectedLayer} onSelect={setLayer} onToggle={redraw}/>)
    return <VBox className={'right-column second-row'}>
        {layers}
        <Toolbox>
            <button className="borderless"><PlusSquare size={20}/></button>
        </Toolbox>
    </VBox>
}
