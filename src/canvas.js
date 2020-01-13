import React, {Component} from "react";
import {PointerHandler} from "./pointer.js";
import {HIDPI_FACTOR} from "./common.js"
import {Point} from "./util";

export class PenCanvas extends Component {
    constructor(props) {
        super(props)
        this.cursor = new Point(100,100)
        this.pointerHandler = new PointerHandler()
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.currentLayer().visible) return console.warn("can't draw to a hidden layer")
            this.canvas.style.cursor = 'none'
            this.pointerHandler.reset(this.props.layer,
                this.props.zoom,
                this.currentPen(),
                this.currentEraserPen(),
                this.props.color,
                ()=>this.redraw(),
                )
            this.pointerHandler.pointerDown(e)
            if(this.props.onPenDraw) this.props.onPenDraw()
        }
        this.pointerMove = (e) => {
            if(e.pointerType === 'touch') return
            this.pointerHandler.pointerMove(e,this.cursor)
        }
        this.pointerUp = (e) => {
            const before = this.currentLayer().makeClone()
            this.pointerHandler.pointerUp(e)
            if (this.props.onDrawDone) this.props.onDrawDone(before)
            this.canvas.style.cursor = 'auto'
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
        console.log('drawing')
        //console.time('draw')
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
        if(this.cursor) {
            c.strokeStyle = 'black'
            const r = this.currentPen().radius;
            c.beginPath()
            c.arc(this.cursor.x,this.cursor.y,r,0,Math.PI*2)
            c.stroke()
        }
        c.restore()
        //console.timeEnd('draw')
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

    drawLayer(c, layer) {
        if(!layer.visible) return
        if(layer === this.currentLayer() && this.pointerHandler.isActive()) {
            this.pointerHandler.drawLayer(c,layer)
            return
        }
        layer.drawSelf(c)
    }


}
