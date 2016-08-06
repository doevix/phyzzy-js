// user.js
// mousing functions for user interaction

'use strict'
const MassHighlight = (phyzzy, mouseCoord, hColor) => {
    ctx.strokeStyle = hColor || '#000000'
    const hovered = ph.m.find(m => m.Pi.compare(mouseCoord, m.rad + 10 / ph.scale))
    if (hovered) {
        ctx.beginPath()
        ctx.arc(
            hovered.Pi.x * ph.scale,
            hovered.Pi.y * ph.scale,
            hovered.rad * ph.scale + 5,
            0, 2 * Math.PI, false
        )
        ctx.stroke()
        ctx.closePath()
    }
    return hovered
}

module.exports = {
    MassHighlight
}