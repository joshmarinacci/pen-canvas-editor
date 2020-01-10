import React, {Component} from "react";
import {PointerHandler} from "./pointer.js";
import {HIDPI_FACTOR} from "./common.js"

export class PenCanvas extends Component {
    constructor(props) {
        super(props)
        this.pointerHandler = new PointerHandler()
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.currentLayer().visible) return console.warn("cant draw to a hidden layer")
            this.canvas.style.cursor = 'none'
            this.pointerHandler.reset(this.props.layer,
                this.props.zoom,
                this.currentPen(),
                this.currentEraserPen(),
                this.props.color)
            this.pointerHandler.pointerDown(e)
            if(this.props.onPenDraw) this.props.onPenDraw()
            this.redraw()
        }
        this.pointerMove = (e) => {
            if(e.pointerType === 'touch') return
            this.pointerHandler.pointerMove(e)
            this.redraw()
        }
        this.pointerUp = (e) => {
            const before = this.currentLayer().makeClone()
            this.pointerHandler.pointerUp(e)
            if (this.props.onDrawDone) this.props.onDrawDone(before)
            this.redraw()
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
        // console.time('draw')
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
        // console.timeEnd('draw')
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
