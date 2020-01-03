import React, {Component} from "react";
import {Point} from './util.js'
import {generateBrush} from './pens.js'

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
        this.pointerDown = (e) => {
//            console.log("down",e.pointerType, e.pointerId,e.clientX,e.clientY)
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

            let can2 = generateBrush(this.currentPen(),this.props.color)

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
//            console.log("up",e.pointerType, e.pointerId,e.clientX,e.clientY)
            this.canvas.style.cursor = 'auto'
            // if(e.pointerType === 'touch') return
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
        this.props.doc.layers.forEach(layer => {
            if(layer.visible) c.drawImage(layer.canvas,0,0)
        })
        c.restore()
    }

    currentLayer() {
        return this.props.layer
    }

    currentPen() {
        return this.props.pen
    }
}
