import React, {Component} from "react"
import {Point, Throttle} from './util.js'

const w = 200
const h = 200

function toDeg(th) {
    return th / Math.PI * 180
}


function calcPoint(e) {
    const rect = e.target.getBoundingClientRect()
    return new Point(
        e.clientX - rect.left,
        e.clientY - rect.top
    )
}

export class Dragger extends Component {
    constructor(props) {
        super(props)
        this.state = {
            dragging: false,
            pos: new Point(props.x||600, props.y||100),
            visible:true,
        }
        let start = null
        let init = null
        this.doDown = (e) => {
            this.setState({dragging: true})
            start = new Point(e.pageX, e.pageY)
            init = this.state.pos.copy()
            window.addEventListener('pointermove', this.doMove)
            window.addEventListener('pointerup', this.doUp)
        }

        this.doMove = (e) => {
            let curr = new Point(e.pageX, e.pageY)
            const diff = curr.minus(start)
            this.setState({
                pos: init.plus(diff)
            })
        }
        this.doUp = () => {
            window.removeEventListener('pointermove', this.doMove)
            window.removeEventListener('pointerup', this.doUp)
        }
    }

    render() {
        return <div style={{
            position: 'fixed',
            border: '1px solid black',
            padding: 0,
            margin: 0,
            left: this.state.pos.x,
            top: this.state.pos.y,
            display: this.state.visible?'flex':'none',
            flexDirection: 'column'
        }}>
            <div
                style={{
                    backgroundColor: 'gray',
                    display:'flex',
                    flexDirection:'row',
                    justifyContent:'space-between',
                    userSelect:'none',
                    touchAction:'none',
                }}
                onPointerDown={this.doDown}>
                <label>{this.props.title}</label>
                <button onClick={()=>this.setState({visible:false})}>x</button>
            </div>
            {this.props.children}
        </div>
    }
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b

    if (s === 0) {
        r = g = b = l // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s
        var p = 2 * l - q

        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return [r * 255, g * 255, b * 255]
}

export class HSLPicker extends Component {
    constructor(props) {
        super(props)
        this.throttle = new Throttle(16)
        this.state = {
            hue: 3.14,
            sat: 1.0,
            lit: 0.5,
            pressedHue: false,
            pressedSatLit: false
        }
        this.down = (e) => {
            const pt = calcPoint(e)
            if (this.insideRing(pt)) {
                let hue = this.pointToHue(pt)
                this.setState({pressedHue: true, hue: hue})
                return
            }
            if (this.insideSatLit(pt)) {
                let satlit = this.pointToSatLit(pt)
                this.setState({
                    pressedSatLit: true,
                    sat: satlit.x,
                    lit: satlit.y
                })
            }
        }
        this.move = (e) => {
            if (this.state.pressedHue) {
                let hue = this.pointToHue(calcPoint(e))
                this.setState({hue: hue})
            }
            if (this.state.pressedSatLit) {
                let satlit = this.pointToSatLit(calcPoint(e))
                this.setState({
                    sat: satlit.x,
                    lit: satlit.y
                })
            }
        }
        this.up = () => {
            this.updateColor(this.state.hue,this.state.sat,this.state.lit)
            this.setState({pressedHue: false, pressedSatLit: false})
        }
    }

    componentDidMount() {
        this.redraw()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.throttle.wait(()=>this.redraw())
    }

    render() {
        return <canvas width={200} height={200}
                       style={{
                           padding: 0,
                           margin: 0,
                           borderWidth: 0,
                           gridRowStart: 3,
                           alignSelf: 'end',
                       }}
                       className={'right-column'}
                       ref={(c) => this.canvas = c}
                       onPointerDown={this.down}
                       onPointerMove={this.move}
                       onPointerUp={this.up}
        />
    }

    redraw() {
        // console.time('colorpicker')
        const c = this.canvas.getContext('2d')


        const id = c.getImageData(0, 0, w, h)
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const n = (y * w + x) * 4
                id.data[n + 0] = 0
                id.data[n + 1] = 0
                id.data[n + 2] = 0
                id.data[n + 3] = 255

                //if in hue ring, draw the hue
                this.drawRing(c, x, y, id, n)
                //if in the square, draw the sat and lit
                this.drawSatLit(c, x, y, id, n)
            }
        }
        c.putImageData(id, 0, 0)

        //draw the hue circle
        this.drawIndicator(c,
            w / 2 + Math.sin(this.state.hue) * (w / 2 - 10),
            h / 2 + Math.cos(this.state.hue) * (h / 2 - 10))
        //draw the sat/lit circle
        this.drawIndicator(c,
            w / 2 - w / 4 + this.state.lit * w / 2,
            h / 2 - h / 4 + this.state.sat * h / 2
        )

        this.drawSwatch(c)
        // console.timeEnd('colorpicker')
    }

    drawSatLit(c, x, y, id,n) {
        x = x - w / 4
        y = y - h / 4
        if (x > 0 && x < w / 2) {
            if (y > 0 && y < h / 2) {
                let s = y / (h / 2)
                let l = x / (w / 2)
                const parts = hslToRgb(this.state.hue / (Math.PI * 2),s,l)
                id.data[n + 0] = parts[0]
                id.data[n + 1] = parts[1]
                id.data[n + 2] = parts[2]
            }
        }
    }

    drawIndicator(c, x, y) {

        function drawCircle(color,r) {
            c.strokeStyle = color
            c.beginPath()
            c.arc(x, y, r - 0, 0, Math.PI * 2)
            c.stroke()
        }
        const r = 7
        c.save()
        drawCircle('black',r-0)
        drawCircle('white',r-1)
        drawCircle('black',r-2)
        c.restore()
    }

    insideRing(pt) {
        let x = pt.x - w / 2
        let y = pt.y - h / 2
        let or = w / 2
        let ir = or - 20
        if (x * x + y * y < or * or) {
            if (x * x + y * y > ir * ir) {
                return true
            }
        }
        return false
    }

    pointToHue(pt) {
        let x = pt.x - w / 2
        let y = pt.y - h / 2
        return Math.atan2(x, y)
    }

    insideSatLit(pt) {
        let x = pt.x - w / 4
        let y = pt.y - h / 4
        if (x > 0 && x < w / 2 && y > 0 && y < h / 2) {
            return true
        }
        return false
    }

    drawSwatch(c) {
        c.fillStyle = this.toHSL(this.state.hue, this.state.sat, this.state.lit)
        c.fillRect(w - 25, h - 25, 20, 20)
    }

    pointToSatLit(pt) {
        let x = pt.x - w / 4
        let y = pt.y - h / 4
        let s = y / (h / 2)
        let l = x / (w / 2)
        return new Point(s, l)
    }

    toHSL(hue, sat, lit) {
        return `hsl(${toDeg(hue)},${sat * 100}%,${lit * 100}%)`
    }

    drawRing(c, x, y, id, n) {
        x = x - w / 2
        y = y - h / 2
        let or = w / 2
        let ir = or - 20
        if (x * x + y * y < or * or && x * x + y * y > ir * ir) {
            const th = Math.atan2(x, y)
            const parts = hslToRgb(th / (Math.PI * 2), 1.0, 0.5)
            id.data[n + 0] = parts[0]
            id.data[n + 1] = parts[1]
            id.data[n + 2] = parts[2]
        }
        return null
    }

    updateColor(hue, sat, lit) {
        if(this.props.onChange) {
            this.props.onChange({hue:hue,sat:sat,lit:lit})
        }

    }
}

// a button just showing a color, no textf
export const ColorButton = ({color, caption, onClick, selected}) => {
    if(color.hue) {
        color =  `hsla(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%)`
    }
    const style = {
        backgroundColor:color,
        height:'2em',
        width:'2em',
        border:'1px solid black'
    }
    if(selected) {
        style.border = '3px solid white'
    }
    return <button onClick={onClick} style={style}/>
}

// the N most recent colors
export const RecentColors = ({colors, color, onSelect}) => {
    return <div style={{
    }}>
        {colors.map((c,i)=>{
            return <ColorButton key={i} color={c} onClick={()=>onSelect(c)} selected={color===c}/>
        })}
    </div>
};
