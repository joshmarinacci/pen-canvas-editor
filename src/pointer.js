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
        if(!('spacing' in this.eraser)) this.eraser.spacing = 0.25
        if(!('smoothing' in this.eraser)) this.eraser.smoothing = 0.5
        this.color = color
        this.redraw = redraw
    }
    pointerDown(e,pt) {
        this.pressed = true
        this.lastPoint = pt
        this.drawingLayer.clear()
        this.scratchLayer.clear()
        this.drawingLayerVisible = true
        if((e.buttons & 32)>>5 >0) this.pen = this.eraser
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

    pointerMove(e, pts) {
        if(!this.pressed) return
        if((e.buttons & 32)>>5 >0) this.pen = this.eraser
        let pen = this.pen
        let brush = generateBrush(pen, this.color)

        pts.forEach(pt => {
            let currentPoint = smoothPoint(pen, pt, this.lastPoint)
            let dist = this.lastPoint.dist(currentPoint)
            let radius = pen.radius
            let gap = radius * pen.spacing
            let angle = angleBetween(this.lastPoint, currentPoint);
            let x = 0
            let y = 0
            for (let i = 0; i < dist; i += gap) {
                x = this.lastPoint.x + (Math.sin(angle) * i);
                y = this.lastPoint.y + (Math.cos(angle) * i);
                this.drawingLayer.stamp(brush, x - radius, y - radius, pen.flow * pen.spacing * e.pressure, 1.0, 'src-over')
            }
            this.lastPoint = currentPoint
        })
        this.redraw()
    }

    pointerUp(e,pt) {
        this.pressed = false
        if(!this.pen) return
        let blend = 'src-atop'
        if (this.pen.blend === 'erase') blend = "destination-out"
        this.layer.drawLayer(this.drawingLayer, this.pen.opacity, blend)
        this.drawingLayerVisible = false
        this.redraw()
    }

}

export function smoothPoint(pen, cp, lp) {
{    let a = pen.smoothing*0.5
    return new Point(
        cp.x*(1-a) + lp.x*a,
        cp.y*(1-a) + lp.y*a,
    )
}}
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
