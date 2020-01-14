import {generateBrush} from "./pens";
import {Layer} from "./layers";
import {Point} from "./util";
import {DH, DW, HIDPI_FACTOR} from "./common";

function angleBetween(point1, point2) {
    return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}


export class PointerHandler {
    constructor() {
        this.pressed = false
        this.prev = null
        this.zoom = 1
        this.scratchLayer = new Layer(DW,DH,'scratch')
        this.drawingLayer = new Layer(DW,DH,'pen-layer')
        this.drawingLayerVisible = false
        this.redraw = null
    }
    reset(layer,zoom,pen,eraser,color, redraw) {
        this.layer = layer
        this.zoom = zoom
        this.pen = pen
        if(!('spacing' in this.pen)) this.pen.spacing = 0.25
        if(!('smoothing' in this.pen)) this.pen.smoothing = 0.5
        this.eraser = eraser
        this.color = color
        this.redraw = redraw
    }
    pointerDown(e) {
        const pt = this.getPoint(e)
        this.pressed = true
        this.lastPoint = pt
        this.drawingLayer.clear()
        this.scratchLayer.clear()
        this.drawingLayerVisible = true
        this.redraw()
    }


    isActive() {
        return this.drawingLayerVisible
    }

    drawLayer(c,layer) {
        this.scratchLayer.clear()
        this.scratchLayer.drawLayer(layer)
        let blend = 'src-atop'
        if(this.pen.blend === 'erase') blend = "destination-out"
        this.scratchLayer.drawLayer(this.drawingLayer,this.pen.opacity,blend)
        this.scratchLayer.drawSelf(c)
    }
    getPoint(e) {
        const rect = e.target.getBoundingClientRect()
        let pt = new Point(
            e.clientX - rect.left,
            e.clientY - rect.top
        )
        const scale = Math.pow(2,this.zoom)*HIDPI_FACTOR
        pt = pt.div(scale)
        return pt
    }

    pointerMove(e, cursor) {
        if(!this.pressed) return
        let pen = this.pen
        if((e.buttons & 32)>>5 >0) pen = this.eraser

        let currentPoint = this.getPoint(e)
        cursor.copyFrom(currentPoint)
        currentPoint = this.smoothPoint(pen, currentPoint,this.lastPoint)

        let dist = this.lastPoint.dist(currentPoint)
        let radius = pen.radius
        let gap = radius*pen.spacing
        let angle = angleBetween(this.lastPoint, currentPoint);
        let x = 0
        let y = 0
        let brush = generateBrush(pen,this.color)
        for (let i = 0; i < dist; i += gap) {
            x = this.lastPoint.x + (Math.sin(angle) * i);
            y = this.lastPoint.y + (Math.cos(angle) * i);
            this.drawingLayer.stamp(brush,x-radius,y-radius,pen.flow*pen.spacing*e.pressure,1.0,'src-over')
        }
        this.lastPoint = currentPoint
        this.redraw()
    }

    pointerUp(e) {
        this.pressed = false
        let blend = 'src-atop'
        if (this.pen.blend === 'erase') blend = "destination-out"
        this.layer.drawLayer(this.drawingLayer, this.pen.opacity, blend)
        this.drawingLayerVisible = false
        this.redraw()
    }

    smoothPoint(pen, cp, lp) {
        let a = pen.smoothing*0.5
        return new Point(
            cp.x*(1-a) + lp.x*a,
            cp.y*(1-a) + lp.y*a,
        )
    }
}

export function brushPath(ctx,pen,color,start,end, pressure) {
    let dist = start.dist(end)
    let radius = pen.radius
    let gap = radius*pen.spacing
    let angle = angleBetween(start, end);
    let brush = generateBrush(pen,color)
    let x = 0
    let y = 0

    for (let i = 0; i < dist; i += gap) {
        x = start.x + (Math.sin(angle) * i);
        y = start.y + (Math.cos(angle) * i);
        ctx.globalAlpha = pen.flow*pen.spacing*pen.opacity*pressure
        ctx.globalCompositeOperation = 'src-over'
        ctx.drawImage(brush,x-radius,y-radius)
    }
}
