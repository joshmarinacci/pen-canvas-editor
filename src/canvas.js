import React, {Component} from "react";
import {Point} from './util.js'
import {drawToSurface} from './pens.js'

function getPoint(e) {
    const rect = e.target.getBoundingClientRect()
    return new Point(
        e.clientX - rect.left,
        e.clientY - rect.top
    )
}

function toDeg(hue) {
    return hue / Math.PI * 180
}

export class PenCanvas extends Component {
    constructor(props) {
        super(props)
        this.pressed = false
        this.prev = null
        this.pointerDown = (e) => {
            if(e.pointerType === 'touch') return
            const pt = getPoint(e)
            this.pressed = true
            this.lastPoint = pt
            this.redraw()
        }
        this.pointerMove = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.pressed) return
            const currentPoint = getPoint(e)

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

            for (let i = 0; i < dist; i += gap) {
                x = this.lastPoint.x + (Math.sin(angle) * i);
                y = this.lastPoint.y + (Math.cos(angle) * i);

                let grad = c.createRadialGradient(x, y, radius / 2, x, y, radius);
                grad.addColorStop(0.0, this.currentFill(1.0));
                grad.addColorStop(0.5, this.currentFill(0.5));
                grad.addColorStop(1.0, this.currentFill(0.0));

                c.fillStyle = grad;
                c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
            }
            this.lastPoint = currentPoint
            this.redraw()
        }
        this.pointerUp = (e) => {
            if(e.pointerType === 'touch') return
            this.pressed = false
        }
    }

    plotPoint(x, y) {
        const pen = this.currentPen()
        const can = this.currentLayer().canvas
        const c = can.getContext('2d')
        drawToSurface(c,this.currentFill(),pen,x,y)
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
        this.props.doc.layers.forEach(layer => {
            const c = this.canvas.getContext('2d')
            c.drawImage(layer.canvas,0,0)
        })
    }

    currentLayer() {
        return this.props.doc.layers[0]
    }

    currentPen() {
        return this.props.pen
    }

    currentFill(a) {
        const color = this.props.color
        if(typeof a !== 'undefined') return `hsla(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%,${a})`
        return `hsl(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%)`
    }

}