// user.js
// mousing functions for user interaction

'use strict'
const MassHighlight = (phyzzy, mouseCoord, hColor) => {
    ctx.strokeStyle = hColor || '#000000'
    ph.m.forEach(m => {
        if (m.Pi.compare(mouseCoord, m.rad + 10 / ph.scale)) {
            ctx.beginPath()
            ctx.arc(
                m.Pi.x * ph.scale,
                m.Pi.y * ph.scale,
                m.rad * ph.scale + 5,
                0, 2 * Math.PI, false
            )
            ctx.stroke()
            ctx.closePath()
        }
    })
}

module.exports = {
    MassHighlight
}