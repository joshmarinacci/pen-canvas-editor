import React, {useEffect, useState} from 'react'

export class Observer {
    constructor(value) {
        this.cbs = []
        this.value = value
    }
    addEventListener(cb) {
        this.cbs.push(cb)
    }
    removeEventListener(cb) {
        this.cbs = this.cbs.filter(c => c!==cb)
    }
    get() { return this.value }
    set(value) {
        this.value = value
        this.notify(this.value)
    }
    notify(e) {
        this.cbs.forEach(cb=>cb(e))
    }
}


export class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    minus(pt) {
        return new Point(
            this.x - pt.x,
            this.y - pt.y
        )
    }

    plus(pt) {
        return new Point(
            this.x + pt.x,
            this.y + pt.y
        )
    }

    copy() {
        return new Point(this.x, this.y)
    }
    dist(pt) {
        let dx = this.x - pt.x
        let dy = this.y - pt.y
        return Math.sqrt(dx*dx + dy*dy)
    }
    div(val) {
        return new Point(
            this.x/val,
            this.y/val
        )
    }
}


export const HBox = (props) => {
    const {style, ...rest} = props

    const styles = {
        display:'flex',
        flexDirection:'row',
        ...style
    }
    if(props.grow) styles.flex = '1.0'
    return <div style={styles} {...rest}>{props.children}</div>
}
export const VBox = (props) => {
    const {style, ...rest} = props
    const styles = {
        display:'flex',
        flexDirection:'column',
        ...style
    }
    if(props.grow) styles.flex = '1.0'
    return <div style={styles} {...rest}>{props.children}</div>
}
//an hbox with a border
export const Toolbox = ({className, ...rest}) => {
    className = "toolbar " + className
    return <HBox className={className} {...rest}/>
}

export function toDeg(theta) {
    return theta / Math.PI * 180
}


export function clearCanvas(canvas) {
    const c = canvas.getContext('2d')
    c.save()
    c.fillStyle = 'rgba(255,255,255,0)'
    c.globalCompositeOperation = 'copy'
    c.fillRect(0,0,canvas.width,canvas.height)
    c.restore()
}


export function cloneCanvas(canvas) {
    const can2 = document.createElement('canvas')
    can2.width = canvas.width
    can2.height = canvas.height
    const ctx = can2.getContext('2d')
    ctx.drawImage(canvas,0,0)
    return can2
}

export function copyToCanvas(src, dst) {
    clearCanvas(dst)
    const ctx = dst.getContext('2d')
    ctx.drawImage(src,0,0)
}


export const Spacer = () => <div style={{flex:1}}/>

export const EditableLabel = ({initialValue,onDoneEditing})=>{
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(initialValue)
    //update value when initial value changes
    useEffect(()=>setValue(initialValue),[initialValue])

    if(editing) {
        return  <input type="text" value={value}
                       onKeyDown={(e)=>{
                           if(e.key === 'Enter') {
                               if(onDoneEditing) onDoneEditing(e.target.value)
                               setEditing(false)
                           }
                       }}
                       onChange={(e)=>setValue(e.target.value)}/>
    } else {
        return <label onDoubleClick={()=>setEditing(true)}>{value}</label>
    }
}
