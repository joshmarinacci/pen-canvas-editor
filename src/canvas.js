import React, {Component} from "react";

export class PenCanvas extends Component {
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
                   onClick={(e)=>this.draw(e)}
           ></canvas>
        </div>
    }

    redraw() {
        this.props.doc.layers.forEach(layer => {
            const c = this.canvas.getContext('2d')
            c.drawImage(layer.canvas,0,0)
        })
    }

    draw(e) {
        const can = this.props.doc.layers[0].canvas
        const c = can.getContext('2d')
        c.fillStyle = 'blue'
        c.fillRect(e.clientX,e.clientY,25,25)
        this.redraw()
    }
}