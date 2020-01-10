import React, {useEffect, useRef, useState} from 'react'
import {toDeg, VBox} from './util.js'
import {HBox, Point, Spacer} from "./util";
import {brushPath} from "./pointer";

// panel that shows settings for a pen, let you customize them
export const PenEditor = ({startPen,onClose}) => {
    const brushCanvas = useRef()
    const sampleCanvas = useRef()
    const [pen, setPen] = useState(startPen)
    const updateStateFloat = (key,scale=1) => {
        return (e)=>{
            const val = parseFloat(e.target.value)*scale
            setPen(old => {
                const obj = {...old}
                obj[key] = val
                return obj
            })
        }
    }
    useEffect(()=>{
        const c = brushCanvas.current.getContext('2d')
        c.save()
        c.fillStyle = 'white'
        c.fillRect(0,0,brushCanvas.current.width,brushCanvas.current.height)
        const img = generateBrush(pen,{hue:0,sat:1.0,lit:0.5})
        c.globalAlpha = pen.opacity
        c.drawImage(img,brushCanvas.current.width/2-img.width/2,brushCanvas.current.height/2-img.height/2)
        c.restore()

        sampleCanvas.current.width = 200
        sampleCanvas.current.height = 200
        const s = sampleCanvas.current.getContext('2d')
        s.save()
        s.fillStyle = 'white'
        s.fillRect(0,0,sampleCanvas.current.width,sampleCanvas.current.height)
        brushPath(s,pen,{hue:0, sat:1.0, lit:0.5},new Point(30,30), new Point(200-30,200-30))
        brushPath(s,pen,{hue:0, sat:1.0, lit:0.5},new Point(30,200-30), new Point(200-30,30))
        s.restore()

    })
    return <VBox className={'dialog'}>
        <header>edit pens</header>
        <VBox className={'body'}>
            <HBox>
                <VBox>
                    <HBox>
                        <canvas ref={brushCanvas} style={{border:'1px solid black'}} width={64} height={64}/>
                    </HBox>
                    <HBox>
                        <label>radius</label>
                        <input type="range" min={1} max={32} value={pen.radius}  onChange={updateStateFloat('radius')}/>
                        <label>{pen.radius}</label>
                    </HBox>
                    <HBox>
                        <label>hardness</label>
                        <input type="range" min={0} max={1000} value={pen.hardness*1000}  onChange={updateStateFloat('hardness',0.001)}/>
                        <label>{(pen.hardness*100).toFixed(1)}%</label>
                    </HBox>
                    <HBox>
                        <label>flow</label>
                        <input type="range" min={0} max={1000} value={pen.flow*1000}  onChange={updateStateFloat('flow',0.001)}/>
                        <label>{(pen.flow*100).toFixed(1)}%</label>
                    </HBox>
                    <HBox>
                        <label>opacity</label>
                        <input type="range" min={0} max={1000} value={pen.opacity*1000} onChange={updateStateFloat('opacity',0.001)}/>
                        <label>{(pen.opacity*100).toFixed(1)}%</label>
                    </HBox>
                </VBox>
                <canvas ref={sampleCanvas} style={{width:200, height:200, border:'1px solid black'}}/>
            </HBox>
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>onClose(pen)}>close</button>
        </footer>
    </VBox>
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
    let hardness = Math.min(pen.hardness,0.999)
    can2.width = radius*2
    can2.height = radius*2
    let c2 = can2.getContext('2d')
    let grad = c2.createRadialGradient(radius, radius, radius / 2, radius, radius, radius)
    grad.addColorStop(hardness, currentFill(pen,color,1.0))
    grad.addColorStop((hardness+1.0)/2, currentFill(pen,color,0.5))
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
        if(pen.blend === 'erase') c.fillStyle = 'black'
        c.fillRect(0,0,w,h)
        const brush = generateBrush(pen,color)
        c.drawImage(brush,w/2-pen.radius,h/2-pen.radius)
        const l = 4
        c.lineWidth = l
        c.strokeStyle = (pen === selected) ? '#000' : '#ddd'
        c.strokeRect(l/2,l/2,w-l,h-l)
    })
    return <canvas className={'brush'} width={64} height={64} ref={canvas}  onClick={()=>onSelect(pen)}/>
}

export const RecentPens = ({pens, selected, onSelect, onChange, color, onEdit}) => {
    return <VBox className='left-column second-row'>
        {pens.map((pen, i) => <PenView key={i} pen={pen} onSelect={onSelect} color={color} selected={selected}/>)}
        <button onClick={onEdit}>edit</button>
    </VBox>
};
