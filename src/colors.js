import React, {Component, useState} from "react"

const w = 200
const h = 200

function toDeg(th) {
    return th / Math.PI * 180
}

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    minus(pt) {
        return new Point(
            this.x-pt.x,
            this.y-pt.y
        )
    }
    plus(pt) {
        return new Point(
            this.x+pt.x,
            this.y+pt.y
        )
    }
    copy() {
        return new Point(this.x,this.y)
    }
}

function calcPoint(e) {
    const rect = e.target.getBoundingClientRect()
    return new Point(
        e.clientX-rect.left,
        e.clientY-rect.top,
    )
}

export class Dragger extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging:false,
            pos: new Point(50,600)
        }
        let start = null
        let init = null
        this.doDown = (e) => {
            this.setState({dragging: true})
            start = new Point(e.pageX, e.pageY)
            init = this.state.pos.copy()
            window.addEventListener('mousemove', this.doMove)
            window.addEventListener('mouseup',this.doUp)
        }

        this.doMove = (e) => {
            let curr = new Point(e.pageX, e.pageY)
            const diff = curr.minus(start)
            this.setState({
                pos:init.plus(diff)
            })
        }
        this.doUp = () => {
            window.removeEventListener('mousemove', this.doMove)
            window.removeEventListener('mouseup',this.doUp)
        }
    }

    render() {
        return <div style={{
            position:'fixed',
            border:'1px solid black',
            padding:0,
            margin:0,
            left:this.state.pos.x,
            top:this.state.pos.y,
            display:'flex',
            flexDirection:'column'
        }}>
            <div
                style={{
                    backgroundColor:'gray'
                }}
                onMouseDown={this.doDown}>.</div>
            {this.props.children}
        </div>
    }
}

export class HSLPicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hue:3.14,
            sat:1.0,
            lit:0.5,
            pressedHue:false,
            pressedSatLit:false,
        }
        this.mouseDown = (e)=>{
            const pt = calcPoint(e)
            console.log("down",pt)
            if(this.insideRing(pt)) {
                let hue = this.pointToHue(pt)
                this.setState({pressedHue:true, hue:hue})
                return
            }
            if(this.insideSatLit(pt)) {
                let satlit = this.pointToSatLit(pt)
                this.setState({
                    pressedSatLit:true,
                    sat:satlit.x,
                    lit:satlit.y,
                })
            }
        }
        this.mouseMove = (e) => {
            if(this.state.pressedHue) {
                let hue = this.pointToHue(calcPoint(e))
                this.setState({hue:hue})
            }
            if(this.state.pressedSatLit) {
                let satlit = this.pointToSatLit(calcPoint(e))
                this.setState({
                    sat:satlit.x,
                    lit:satlit.y,
                })
            }
        }
        this.mouseUp = () => {
            this.setState({pressedHue:false, pressedSatLit:false})
        }
    }
    componentDidMount() {
        this.redraw()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        this.redraw()
    }

    render() {
        return <canvas width={200} height={200}
                       style={{
                           padding:0,
                           margin:0,
                           borderWidth:0,
                       }}
                       ref={(c)=>this.canvas=c}
                       onMouseDown={this.mouseDown}
                       onMouseMove={this.mouseMove}
                       onMouseUp={this.mouseUp}
        ></canvas>
    }

    redraw() {
        const c = this.canvas.getContext('2d')

        function drawRing(c, x, y) {
            x = x-w/2
            y = y-h/2
            let or = w/2
            let ir = or-20
            if(x*x+y*y < or*or) {
                const th = Math.atan2(x,y)
                c.fillStyle = `hsl(${toDeg(th)},100%,50%)`
                if(x*x+y*y < ir*ir) {
                    c.fillStyle = 'black'
                }
            }
        }


        for(let x=0; x<w; x++) {
            for(let y=0; y<h; y++) {
                c.fillStyle = 'black'
                //if in hue ring, draw the hue
                drawRing(c,x,y)
                this.drawSatLit(c,x,y)
                c.fillRect(x,y,1,1)
                //if in the square, draw the sat and lit
            }
        }
        //draw the hue circle
        this.drawIndicator(c,
            w/2+Math.sin(this.state.hue)*(w/2-10),
            h/2+Math.cos(this.state.hue)*(h/2-10))
        //draw the sat/lit circle
        this.drawIndicator(c,
            w/2-w/4+this.state.lit*w/2,
            h/2-h/4+this.state.sat*h/2,
        )

        this.drawSwatch(c)
    }

    drawSatLit(c, x, y) {
        x = x - w/4
        y = y - h/4
        if(x > 0 && x < w/2) {
            if(y > 0 && y < h/2) {
                let s = y/(h/2)
                let l = x/(w/2)
                c.fillStyle = this.toHSL(this.state.hue,s,l)
            }
        }
    }

    drawIndicator(c, x, y) {
        const r = 7
        c.save()
        c.strokeStyle = 'black'
        c.beginPath()
        c.arc(x,y,r-0,0,Math.PI*2)
        c.stroke()
        c.strokeStyle = 'white'
        c.beginPath()
        c.arc(x,y,r-1,0,Math.PI*2)
        c.stroke()
        c.strokeStyle = 'black'
        c.beginPath()
        c.arc(x,y,r-2,0,Math.PI*2)
        c.stroke()
        c.restore()
    }

    insideRing(pt) {
        let x = pt.x-w/2
        let y = pt.y-h/2
        let or = w/2
        let ir = or-20
        if(x*x+y*y < or*or) {
            if(x*x+y*y > ir*ir) {
                return true
            }
        }
        return false
    }

    pointToHue(pt) {
        let x = pt.x-w/2
        let y = pt.y-h/2
        return Math.atan2(x,y)
    }

    insideSatLit(pt) {
        let x = pt.x - w/4
        let y = pt.y - h/4
        if(x > 0 && x < w/2 && y > 0 && y < h/2) {
            return true
        }
        return false
    }

    drawSwatch(c) {
        c.fillStyle = this.toHSL(this.state.hue,this.state.sat,this.state.lit)
        c.fillRect(w-25,h-25,20,20)
    }

    pointToSatLit(pt) {
        let x = pt.x - w/4
        let y = pt.y - h/4
        let s = y/(h/2)
        let l = x/(w/2)
        return new Point(s,l)
    }

    toHSL(hue, sat, lit) {
        return `hsl(${toDeg(hue)},${sat*100}%,${lit*100}%)`
    }
}
