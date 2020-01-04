import React, {useEffect, useRef} from 'react'
import {toDeg, VBox} from './util.js'

// panel that shows settings for a pen, let you customize them
const PenEditor = () => {
    return <div> edit the pen</div>
};

function currentFill(pen,color,a) {
    let alpha = 1.0
    if(typeof a !== 'undefined') alpha = a;
    if(pen.blend === 'erase') return `rgba(255,255,255,${alpha})`
    return `hsla(${toDeg(color.hue)},${color.sat*100}%,${color.lit*100}%,${alpha})`
}


export function generateBrush(pen, color) {
    let radius = pen.radius
    let can2 = document.createElement('canvas')
    can2.width = radius*2
    can2.height = radius*2
    let c2 = can2.getContext('2d')
    let grad = c2.createRadialGradient(radius, radius, radius / 2, radius, radius, radius)
    grad.addColorStop(0.0, currentFill(pen,color,1.0))
    grad.addColorStop(0.5, currentFill(pen,color,0.5))
    grad.addColorStop(1.0, currentFill(pen,color,0.0))
    c2.fillStyle = grad
    c2.fillRect(0,0,radius*2,radius*2)
    return can2
}

export const PenView = ({pen,color, onSelect, selected}) => {
    const canvas = useRef(null)
    //whenever a prop changes, this is called to redraw the canvas
    useEffect(()=>{
        const cv = canvas.current
        const c = cv.getContext('2d')
        let w = 64*2
        let h = 64*2
        cv.width = w
        cv.height = h
        c.fillStyle = 'white'
        c.fillRect(0,0,w,h)
        const brush = generateBrush(pen,color)
        c.drawImage(brush,w/2-pen.radius,h/2-pen.radius)
        const l = 4
        c.lineWidth = l
        c.strokeStyle = (pen === selected) ? '#000' : '#ddd'
        c.strokeRect(l/2,l/2,w-l,h-l)
    })
    return <canvas width={64} height={64} ref={canvas}  onClick={()=>onSelect(pen)}/>

}

export const RecentPens = ({pens, selected, onSelect, onChange, color}) => {
    return <VBox className='left-column second-row'>{pens.map((pen, i) => {
        return <PenView key={i} pen={pen} onSelect={onSelect} color={color} selected={selected}/>
    })}
    </VBox>
};
