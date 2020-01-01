import React from 'react'

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
