import {generateBrush} from "./pens";
import {Layer} from "./layers";
import {Point} from "./util";
import {HIDPI_FACTOR} from "./common";

function angleBetween(point1, point2) {
    return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}


export class PointerHandler {
    constructor() {
        this.pressed = false
        this.prev = null
        this.zoom = 1
        this.scratchLayer = new Layer(1024,1024,'scratch')
        this.drawingLayer = new Layer(1024,1024,'pen-layer')
        this.drawingLayerVisible = false
    }
    reset(layer,zoom,pen,eraser,color) {
        this.layer = layer
        this.zoom = zoom
        this.pen = pen
        this.eraser = eraser
        this.color = color
    }
    pointerDown(e) {
        const pt = this.getPoint(e)
        this.pressed = true
        this.lastPoint = pt
        this.prepDrawingLayer()
    }


    isActive() {
        return this.drawingLayerVisible
    }
    prepDrawingLayer() {
        this.drawingLayer.clear()
        this.scratchLayer.clear()
        this.drawingLayerVisible = true
    }

    drawLayer(c,layer) {
        this.scratchLayer.clear()
        this.scratchLayer.drawLayer(layer)
        let blend = 'src-atop'
        if(this.pen.blend === 'erase') blend = "destination-out"
        this.scratchLayer.drawLayer(this.drawingLayer,1.0,blend)
        c.globalAlpha = this.pen.opacity
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

    pointerMove(e) {
        if(!this.pressed) return
        const currentPoint = this.getPoint(e)

        let dist = this.lastPoint.dist(currentPoint)
        let pen = this.pen
        if((e.buttons & 32)>>5 >0) pen = this.eraser
        let radius = pen.radius
        let gap = radius/3
        let angle = angleBetween(this.lastPoint, currentPoint);
        let x = 0
        let y = 0
        let brush = generateBrush(pen,this.color)

        for (let i = 0; i < dist; i += gap) {
            x = this.lastPoint.x + (Math.sin(angle) * i);
            y = this.lastPoint.y + (Math.cos(angle) * i);
            this.drawingLayer.stamp(brush,x-radius,y-radius,pen.flow,1.0,'src-over')
        }
        this.lastPoint = currentPoint
    }

    pointerUp(e) {
        this.pressed = false
        let blend = 'src-atop'
        if (this.pen.blend === 'erase') blend = "destination-out"
        this.layer.drawLayer(this.drawingLayer, this.pen.opacity, blend)
        this.drawingLayerVisible = false
    }

}
