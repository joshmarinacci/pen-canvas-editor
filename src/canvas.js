import React, {Component} from "react";

export class PenCanvas extends Component {
    componentDidMount() {
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
           ></canvas>
        </div>
    }

    redraw() {
        console.log("drawing ",this.props.doc)
        this.props.doc.layers.forEach(layer => {
            const c = this.canvas.getContext('2d')
            c.drawImage(layer.canvas,0,0)
        })
    }
}