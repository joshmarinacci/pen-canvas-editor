import React, {useContext, useEffect, useRef, useState} from 'react'
import {toDeg, VBox} from './util.js'
import {DialogContext, HBox, Point, Spacer} from "./util";
import {brushPath} from "./pointer";

const StateRangeInput = ({name, min=0, max=1, pen, update, scale=1}) => {
    return <HBox>
            <label>{name}</label>
            <input type="range" min={min*scale}
                   max={max*scale}
                   value={pen[name]*scale}
                   onChange={update(name,1.0/scale)}/>
            <label>{(pen[name]).toFixed(2)}</label>
    </HBox>
}

// panel that shows settings for a pen, let you customize them
export const PenEditor = ({startPen,onClose}) => {
    if(!('spacing' in startPen)) {
        console.log("the pen is missing spacing")
        startPen.spacing = 0.25
        startPen.smoothing = 0.2
    }

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
    const updateStateString = (key) => {
        return (e)=>{
            const val = e.target.value
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
        brushPath(s,pen,img,{hue:0, sat:1.0, lit:0.5},new Point(30,30), new Point(200-30,200-30), 0.2)
        brushPath(s,pen,img,{hue:0, sat:1.0, lit:0.5},new Point(30,200-30), new Point(200-30,30), 0.8)
        s.restore()
    })
    return <VBox className={'dialog'}>
        <header>edit pens</header>
        <VBox className={'body'}>
            <HBox>
                <VBox>
                    <HBox>
                        <label>name</label>
                        <input type="text" value={pen.title} onChange={updateStateString('title')}/>
                    </HBox>
                    <HBox>
                        <canvas ref={brushCanvas} style={{border:'1px solid black'}} width={64} height={64}/>
                    </HBox>
                    <StateRangeInput name={'radius'} min={0.5} max={32} pen={pen} update={updateStateFloat}/>
                    <StateRangeInput name={'hardness'} pen={pen} update={updateStateFloat} scale={1000}/>
                    <StateRangeInput name={'flow'} pen={pen} scale={1000} update={updateStateFloat}/>
                    <StateRangeInput name={'opacity'} pen={pen} scale={1000} update={updateStateFloat}/>
                    <StateRangeInput name={'spacing'} min={0.05} max={3} pen={pen} scale={1000} update={updateStateFloat}/>
                    <StateRangeInput name={'smoothing'} pen={pen} scale={1000} update={updateStateFloat}/>
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
    })
    return <div className={'brush'+((pen===selected)?" selected":"")}>
        <canvas width={64} height={64} ref={canvas}  onClick={()=>onSelect(pen)}/>
        <label>{pen.title}</label>
    </div>
}

export const RecentPens = ({pens, selected, onSelect, onChange, color, onEdit}) => {
    const dm = useContext(DialogContext)
    const editPen = () => {
        dm.show(<PenEditor startPen={selected} onClose={(pen)=> {
            dm.hide();
            onEdit(pen);
        }}/>)
    }
    return <VBox className='left-column second-row'>
        {pens.map((pen, i) => <PenView key={i} pen={pen} onSelect={onSelect} color={color} selected={selected}/>)}
        <button onClick={editPen}>edit</button>
    </VBox>
};
