export function drawToSurface(c, fill, pen, x,y) {
    c.fillStyle = fill
    c.beginPath()
    c.arc(x,y,pen.radius, 0, Math.PI*2)
    c.fill()
}
