import React, {Component} from "react";
import {Point} from './util.js'
import {generateBrush} from './pens.js'
import {clearCanvas, cloneCanvas} from "./util";

const HIDPI_FACTOR = 0.5

export class Layer {
    constructor(w,h,title) {
        this.type = 'layer'
        this.visible = true
        this.canvas = null

        this.thumb={
            width:64,
            height:64,
            canvas:null,
        }

        this.width = w
        this.height = h
        this.title = title

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.width
        this.canvas.height = this.height

        const c = this.canvas.getContext('2d')
        c.save()
        c.fillStyle = 'rgba(255,255,255,0)'
        c.globalCompositeOperation = 'copy'
        c.fillRect(0,0,w,h)
        c.restore()


        const tcan = document.createElement('canvas')
        tcan.width = 64
        tcan.height = 64
        const c2 = tcan.getContext('2d')
        c2.drawImage(this.canvas,0,0,64,64)
        this.thumb.canvas = c2
    }

    stamp(brush,x,y,flow,opacity,blend){
        const c = this.canvas.getContext('2d')
        c.save()
        c.globalAlpha = flow
        c.globalCompositeOperation = blend
        c.drawImage(brush,x,y,brush.width,brush.height)
        c.restore()
    }
    clear() {
        const c = this.canvas.getContext('2d')
        c.save()
        c.fillStyle = 'rgba(255,255,255,0)'
        c.globalCompositeOperation = 'copy'
        c.fillRect(0,0,1024,1024)
        c.restore()
    }
    drawSelf(ctx) {
        ctx.drawImage(this.canvas,0,0)
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
                this.getDrawingLayer().stamp(brush,x-radius,y-radius,pen.flow,1.0,'src-over')
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
        this.getDrawingLayer().clear()
        this.getScratchLayer().clear()
        this.drawingLayerVisible = true
    }

    getDrawingLayer() {
        if(!this.drawingLayer) this.drawingLayer = new Layer(1024,1024,'temp-drawing-layer')
        return this.drawingLayer
    }

    drawLayer(c, layer) {
        if(!layer.visible) return
        if(layer === this.currentLayer() && this.drawingLayerVisible) {
            this.getScratchLayer().clear()
            const c2 = this.getScratchLayer().canvas.getContext('2d')
            c2.save()
            layer.drawSelf(c2)
            if(this.currentPen().blend === 'erase') c2.globalCompositeOperation = "destination-out"
            this.getDrawingLayer().drawSelf(c2)
            c2.restore()
            c.globalAlpha = this.currentPen().opacity
            this.getScratchLayer().drawSelf(c)
            return
        }
        layer.drawSelf(c)
    }

    mergeDrawingLayer() {
        const before = cloneCanvas(this.currentLayer().canvas)
        const c = this.currentLayer().canvas.getContext('2d')
        c.save()
        c.globalAlpha = this.currentPen().opacity
        if(this.currentPen().blend === 'erase') c.globalCompositeOperation = "destination-out"
        this.drawingLayer.drawSelf(c)
        c.restore()
        if(this.props.onDrawDone) this.props.onDrawDone(before)
        this.drawingLayerVisible = false
        this.redraw()
    }



    getScratchLayer() {
        if(!this.scratchLayer) this.scratchLayer = new Layer(1024,1024,'scratch')
        return this.scratchLayer
    }
}
