import React, {Component} from "react";
import {Point} from './util.js'
import {toDeg} from "./util";


export class PenCanvas extends Component {
    getPoint(e) {
        const rect = e.target.getBoundingClientRect()
        let pt = new Point(
            e.clientX - rect.left,
            e.clientY - rect.top
        )
        const scale = Math.pow(2,this.props.zoom)
        pt = pt.div(scale)
        return pt
    }
    constructor(props) {
        super(props)
        this.pressed = false
        this.prev = null
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') return
            this.canvas.style.cursor = 'none'
            const pt = this.getPoint(e)
            this.pressed = true
            this.lastPoint = pt
            if(this.props.onPenDraw) this.props.onPenDraw()
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
            let radius = this.currentPen().radius
            let gap = radius/3
            let angle = angleBetween(this.lastPoint, currentPoint);
            let x = 0
            let y = 0
            const can = this.currentLayer().canvas
            const c = can.getContext('2d')

            let can2 = document.createElement('canvas')
            can2.width = radius*2
            can2.height = radius*2
            let c2 = can2.getContext('2d')
            let grad = c.createRadialGradient(radius, radius, radius / 2, radius, radius, radius);
            grad.addColorStop(0.0, this.currentFill(1.0));
            grad.addColorStop(0.5, this.currentFill(0.5));
            grad.addColorStop(1.0, this.currentFill(0.0));
            c2.fillStyle = grad
            c2.fillRect(0,0,radius*2,radius*2)

            c.save()
            for (let i = 0; i < dist; i += gap) {
                x = this.lastPoint.x + (Math.sin(angle) * i);
                y = this.lastPoint.y + (Math.cos(angle) * i);
                if(this.currentPen().blend === 'erase') c.globalCompositeOperation = "destination-out"
                c.drawImage(can2,x-radius,y-radius,radius*2,radius*2)
            }
            c.restore()
            this.lastPoint = currentPoint
            this.redraw()
        }
        this.pointerUp = (e) => {
            this.canvas.style.cursor = 'auto'
            if(e.pointerType === 'touch') return
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
        return <div style={{
            flex: '1.0',
            border: '1px solid black',
        }}>
           <canvas ref={(c)=>this.canvas=c}
                   style={{
                       border:'1px solid black',
                   }}
                   width={500}
                   height={500}
                   onPointerDown={this.pointerDown}
                   onPointerMove={this.pointerMove}
                   onPointerUp={this.pointerUp}
           />
        </div>
    }

    redraw() {
        if(this.canvas.width !== this.props.doc.width)    this.canvas.width = this.props.doc.width
        if(this.canvas.height !== this.props.doc.height)  this.canvas.height = this.props.doc.height
        const scale = Math.pow(2,this.props.zoom)
        const c = this.canvas.getContext('2d')
        c.save()
        c.scale(scale,scale)
        c.fillStyle = 'magenta'
        c.fillRect(0,0,this.props.doc.width,this.props.doc.height)
        this.props.doc.layers.forEach(layer => c.drawImage(layer.canvas,0,0))
        c.restore()
    }

    currentLayer() {
        return this.props.layer
    }

    currentPen() {
        return this.props.pen
    }

    currentFill(a) {
        const color = this.props.color
        let alpha = 1.0
        if(typeof a !== 'undefined') alpha = a;
        if(this.currentPen().blend === 'erase') return `rgba(255,255,255,${alpha})`
        return `hsla(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%,${alpha})`
    }

}
