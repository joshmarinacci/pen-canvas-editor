import React, {useContext, useEffect, useState} from 'react'

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
    copyFrom(pt) {
        this.x = pt.x
        this.y = pt.y
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
        return  <input className={"editable-label"} type="text" value={value}
                       onKeyDown={(e)=>{
                           if(e.key === 'Enter') {
                               if(onDoneEditing) onDoneEditing(e.target.value)
                               setEditing(false)
                           }
                       }}
                       onChange={(e)=>setValue(e.target.value)}/>
    } else {
        return <label className={"editable-label"} onDoubleClick={()=>setEditing(true)}>{value}</label>
    }
}

class DialogManager extends Observer {
    show(payload){
        this.set(payload)
    }
    hide(){
        this.set(null)
    }
}
const dm = new DialogManager()

export const DialogContext = React.createContext(dm)

export const DialogContainer = () => {
    const dm = useContext(DialogContext)
    const [dialog,setDialog] = useState(dm.get())
    useEffect(()=>{
        const onChange = (val) => setDialog(val)
        dm.addEventListener(onChange)
        return () => dm.removeEventListener(onChange)
    })
    const style = {
        border:'1px solid red',
        position:'fixed',
        width:'100vw',
        height:'100vh',
        backgroundColor: 'rgba(255,255,255,0.9',
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
    }
    if(!dialog) style.display = 'none'
    return <div style={style}>{dialog}</div>
}


export const DocStats = ({doc}) => {
    const tiles = doc.layers.reduce((acc,layer)=>{
        return acc + layer.getTileCount()
    },0)
    const filled = doc.layers.reduce((acc,layer)=>acc+layer.getFilledTileCount(),0)
    return <div style={{
        background:'white'
    }}>
        <p>doc size {doc.width}x{doc.height}</p>
        <p>layer count = {doc.layers.length}</p>
        <p>tile count = {tiles}</p>
        <p>filled tile count {filled}</p>
    </div>
}


export function forceDownloadDataURL(name, url) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

export function forceDownloadBlob(name,blob) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}


export const DownloadDialog = ({name,url}) => {
    const dm = useContext(DialogContext)

    const download = () => {
        forceDownloadDataURL(name,url)
    }
    return <VBox className={'dialog'}>
        <header>Dialog</header>
        <VBox className={'body'}>
            <button onClick={download}>download</button>
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>dm.hide()}>close</button>
        </footer>
    </VBox>
}