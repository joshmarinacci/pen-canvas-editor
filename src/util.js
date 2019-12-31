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
}
