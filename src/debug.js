import {DialogContext, Spacer, VBox, Point} from "./util";
import React, {useContext, useEffect, useRef} from "react";

import PenData from "./pendata.json"

export const DebugDialog  = ()=>{
    const dm = useContext(DialogContext)
    const canvas = useRef()
    useEffect(()=>{
        const c = canvas.current.getContext('2d')
        c.save()
        c.scale(1,1)
        const pen = {
            radius: 3.0,
            hardness:0.0,
            blend:'overlay',
            spacing: 0.25,
            opacity:1.0,
            smoothing:0
        }
        c.strokeStyle = 'black'
        c.lineWidth = 1
        c.beginPath()
        for(let i=1; i<PenData.length; i++) {
            let prev = new Point(PenData[i-1].x,PenData[i-1].y)
            let curr = new Point(PenData[i].x,PenData[i].y)
            c.lineTo(curr.x,curr.y)
            // curr = smoothPoint(pen,curr,prev)
            // const color = {hue:0, sat:0.0, lit:0.0}
            // brushPath(c,pen,color,prev,curr,0.5)
        }
        c.stroke()
        c.restore()
    })
    return <VBox className={'dialog'}>
        <header>Debug</header>
        <VBox className={'body'}>
            <canvas ref={canvas} style={{border:'1px solid black'}} width={700} height={400}/>
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>dm.hide()}>close</button>
        </footer>
    </VBox>
}
