import React, {Component} from "react";
import {Point} from './util.js'
import {generateBrush} from './pens.js'

const HIDPI_FACTOR = 0.5
const TILE_SIZE = 256

class Tile {
    constructor(size) {
        this.size = size
        this.canvas = null
        this.initCanvas()
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
        this.forAllTiles(t => {
            if(t.canvas) total++
        })
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
        //draws onto every tile
        this.forAllTiles((t,i,j)=>{
            const ctx = t.getCanvas().getContext('2d')
            ctx.save()
            ctx.globalAlpha = flow
            ctx.globalCompositeOperation = blend
            ctx.drawImage(brush,x-i*TILE_SIZE,y-j*TILE_SIZE,brush.width,brush.height)
            ctx.restore()
        })
    }
    clear() {
        this.forAllTiles(t => t.clear())
    }
    drawSelf(ctx) {
        this.forAllTiles((t,i,j) => {
            ctx.drawImage(t.getCanvas(),i*TILE_SIZE,j*TILE_SIZE)
        })
    }
    drawLayer(layer, opacity=1.0, blend='src-atop') {
        // console.log('drawing layer',layer.title,'to',this.title)
        layer.forAllTiles((srcTile,i,j) => {
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

export class PenCanvas extends Component {
    getPoint(e) {
        const rect = e.target.getBoundingClientRect()
        let pt = new Point(
            e.clientX - rect.left,
            e.clientY - rect.top
        )
        const scale = Math.pow(2,this.props.zoom)*HIDPI_FACTOR
        pt = pt.div(scale)
        return pt
    }
    constructor(props) {
        super(props)
        this.pressed = false
        this.prev = null
        this.scratchLayer = new Layer(1024,1024,'scratch')
        this.drawingLayer = new Layer(1024,1024,'pen-layer')
        this.drawingLayerVisible = false
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.currentLayer().visible) return console.warn("cant draw to a hidden layer")
            this.canvas.style.cursor = 'none'
            const pt = this.getPoint(e)
            this.pressed = true
            this.lastPoint = pt
            if(this.props.onPenDraw) this.props.onPenDraw()
            this.prepDrawingLayer()
            this.redraw()
        }
        this.pointerMove = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.pressed) return
            const currentPoint = this.getPoint(e)

            function angleBetween(point1, point2) {
                return Math.atan2(point2.x - point1.x, point2.y - point1.y);
            }


            let dist = this.lastPoint.dist(currentPoint)
            let pen = this.currentPen()
            if((e.buttons & 32)>>5 >0) pen = this.currentEraserPen()
            let radius = pen.radius
            let gap = radius/3
            let angle = angleBetween(this.lastPoint, currentPoint);
            let x = 0
            let y = 0
            let brush = generateBrush(pen,this.props.color)

            for (let i = 0; i < dist; i += gap) {
                x = this.lastPoint.x + (Math.sin(angle) * i);
                y = this.lastPoint.y + (Math.cos(angle) * i);
                this.drawingLayer.stamp(brush,x-radius,y-radius,pen.flow,1.0,'src-over')
            }
            this.lastPoint = currentPoint
            this.redraw()
        }
        this.pointerUp = (e) => {
            this.mergeDrawingLayer()
            this.canvas.style.cursor = 'auto'
            this.pressed = false
        }
    }

    componentDidMount() {
        this.redraw()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.redraw()
    }

    render() {
        return <div className="center-row center-column" style={{
            background:'#ddd',
            flex: '1.0',
            overflow:'auto'
        }}>
           <canvas ref={(c)=>this.canvas=c}
                   width={500}
                   height={500}
                   onPointerDown={this.pointerDown}
                   onPointerMove={this.pointerMove}
                   onPointerUp={this.pointerUp}
                   onPointerCancel={()=> this.pressed = false}
                   onPointerLeave={()=> this.pressed = false  }
                   onPointerOut={()=> this.pressed = false}
                   onContextMenu={(e)=>e.preventDefault()}
           />
        </div>
    }

    redraw() {
        const scale = Math.pow(2,this.props.zoom)
        const cw = this.props.doc.width*scale
        const ch = this.props.doc.height*scale
        if(this.canvas.width !== cw)    {
            this.canvas.width = cw
            this.canvas.style.width = cw*HIDPI_FACTOR +'px'
        }
        if(this.canvas.height !== ch) {
            this.canvas.height = ch
            this.canvas.style.height = ch*HIDPI_FACTOR +'px'
        }
        const c = this.canvas.getContext('2d')
        c.save()
        c.scale(scale,scale)
        c.fillStyle = 'white'
        c.fillRect(0,0,this.props.doc.width,this.props.doc.height)
        this.props.doc.layers.forEach(layer => this.drawLayer(c,layer))
        c.restore()
    }

    currentLayer() {
        return this.props.layer
    }

    currentPen() {
        return this.props.pen
    }
    currentEraserPen() {
        return this.props.eraser
    }

    prepDrawingLayer() {
        this.drawingLayer.clear()
        this.scratchLayer.clear()
        this.drawingLayerVisible = true
    }

    drawLayer(c, layer) {
        if(!layer.visible) return
        if(layer === this.currentLayer() && this.drawingLayerVisible) {
            this.scratchLayer.clear()
            this.scratchLayer.drawLayer(layer)
            let blend = 'src-atop'
            if(this.currentPen().blend === 'erase') blend = "destination-out"
            this.scratchLayer.drawLayer(this.drawingLayer,1.0,blend)
            c.globalAlpha = this.currentPen().opacity
            this.scratchLayer.drawSelf(c)
            return
        }
        layer.drawSelf(c)
    }

    mergeDrawingLayer() {
        const before = this.currentLayer().makeClone()
        let blend = 'src-atop'
        if(this.currentPen().blend === 'erase') blend = "destination-out"
        this.currentLayer().drawLayer(this.drawingLayer,this.currentPen().opacity,blend)
        if(this.props.onDrawDone) this.props.onDrawDone(before)
        this.drawingLayerVisible = false
        this.redraw()
    }

}
