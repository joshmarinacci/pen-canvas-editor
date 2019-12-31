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
            this.plotPoint(pt.x,pt.y)
            this.prev = pt
            this.redraw()
        }
        this.pointerMove = (e) => {
            if(e.pointerType === 'touch') return
            if(!this.pressed) return
            const pt = getPoint(e)
            let dist = this.prev.dist(pt)
            let steps = Math.floor(dist)
            let dx = (pt.x-this.prev.x)/steps
            let dy = (pt.y-this.prev.y)/steps
            for(let i=0; i<steps; i++) {
                this.plotPoint(this.prev.x + i*dx, this.prev.y + i*dy)
            }
            this.redraw()
            this.prev = pt
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

    currentFill() {
        const color = this.props.color
        return `hsl(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%)`
    }

}
