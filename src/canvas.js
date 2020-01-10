import React, {Component} from "react";
import {Point} from './util.js'
import {generateBrush} from './pens.js'
import {Layer} from "./layers";

const HIDPI_FACTOR = 0.5

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
