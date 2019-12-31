import React from 'react'
import {VBox} from './util.js'

export function drawToSurface(c, fill, pen, x,y) {
    c.fillStyle = fill
    c.beginPath()
    c.arc(x,y,pen.radius, 0, Math.PI*2)
    c.fill()
}

// panel that shows settings for a pen, let you customize them
const PenEditor = () => {
    return <div> edit the pen</div>
};

export const RecentPens = ({pens, onChange}) => {
    return <VBox style={{
        minWidth:'100px',
        border:'1px solid black',
    }}>{pens.map((pen, i) => {
        return <button
            key={i}
            onClick={()=>onChange(pen)}
        >{pen.title} {pen.radius}</button>
    })
    }
    </VBox>
};
