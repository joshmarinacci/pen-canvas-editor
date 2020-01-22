import React, {Component} from "react";
import {PointerHandler} from "./pointer.js";
import {HIDPI_FACTOR} from "./common.js"
import {Point} from "./util";


class PanDelegate {
    constructor(canvas,e) {
        this.canvas = canvas
        this.startId = e.pointerId
        this.touchStart = this.canvas.getPointNoTransform(e)
        this.translateStart = this.canvas.translate.copy()
    }
    move(e) {
        if(e.pointerId !== this.startId) return
        const touchCurrent = this.canvas.getPointNoTransform(e)
        this.canvas.translate = touchCurrent.minus(this.touchStart).plus(this.translateStart)
        this.canvas.redraw()
    }
    up(e) {
        this.touchStart = null
        this.canvas.redraw()
        this.canvas.delegate = null
    }
}

export class PenCanvas extends Component {
    constructor(props) {
        super(props)
        this.cursor = new Point(100,100)
        this.pointerHandler = new PointerHandler()
        this.penActive = false
        this.translate = new Point(0,0)
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') {
                if(!this.delegate && !this.penActive) this.delegate = new PanDelegate(this,e)
                return
            }
            if(e.pointerType === 'pen') this.penActive = true
            e.preventDefault()
            e.stopPropagation()
            if(!this.currentLayer().visible) return console.warn("can't draw to a hidden layer")
            this.canvas.style.cursor = 'none'
            this.pointerHandler.reset(this.props.layer,
                this.props.zoom,
                this.currentPen(),
                this.currentEraserPen(),
                this.props.color,
                ()=>this.redraw(),
                )
            this.cursor = this.getPoint(e)
            this.pointerHandler.pointerDown(e,this.cursor)
            if(this.props.onPenDraw) this.props.onPenDraw()
        }
        this.pointerMove = (e) => {
            if(this.delegate) return this.delegate.move(e)
            e.preventDefault()
            this.cursor = this.getPoint(e)
            let points = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
            points = points.map(e => this.getPoint(e))
            this.pointerHandler.pointerMove(e,points)
        }
        this.pointerUp = (e) => {
            if(this.delegate) {
                this.delegate.up(e)
                this.delegate = null
            }
            this.penActive = false
            const before = this.currentLayer().makeClone()
            this.cursor = this.getPoint(e)
            this.pointerHandler.pointerUp(e,this.cursor)
            if (this.props.onDrawDone) this.props.onDrawDone(before)
            this.canvas.style.cursor = 'auto'
        }
        this.pointerCancel = (e) => {
            this.penActive = false
            this.canvas.style.cursor = 'auto'
        }
    }

    getPointNoTransform(e) {
        const rect = e.target.getBoundingClientRect()
        const style = window.getComputedStyle(e.target)
        let pt = new Point(
            e.clientX - rect.left - parseInt(style.borderLeftWidth),
            e.clientY - rect.top - parseInt(style.borderTopWidth)
        )
        pt = pt.div(HIDPI_FACTOR)
        return pt
    }
    getPoint(e) {
        let pt = this.getPointNoTransform(e)
        pt = pt.minus(this.translate)
        const scale = Math.pow(2,this.props.zoom)
        pt = pt.div(scale)
        return pt
    }

    componentDidMount() {
        this.redraw()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.redraw()
    }

    render() {
        return <div ref={(d)=>this.div = d} className="center-row center-column" id='canvas-wrapper' style={{
            background:'#ddd',
            flex: '1.0',
            overflow:'auto'
        }}>
           <canvas className={'drawing-canvas'}
                   ref={(c)=>this.canvas=c}
                   width={500}
                   height={500}
                   onPointerDown={this.pointerDown}
                   onPointerMove={this.pointerMove}
                   onPointerUp={this.pointerUp}
                   onPointerCancel={this.pointerCancel}
                   onContextMenu={(e)=>e.preventDefault()}
           />
        </div>
    }

    redraw() {
        //console.time('draw')
        const scale = Math.pow(2,this.props.zoom)
        const cw = this.div.offsetWidth-4
        const ch = this.div.offsetHeight-4
        if(this.canvas.width !== cw)    {
            this.canvas.width = cw*2
            this.canvas.style.width = cw +'px'
        }
        if(this.canvas.height !== ch) {
            this.canvas.height = ch*2
            this.canvas.style.height = ch +'px'
        }
        const c = this.canvas.getContext('2d')
        c.save()
        c.translate(this.translate.x,this.translate.y)
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
