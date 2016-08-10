// user.js
// mousing functions for user interaction

const Vect = require('./phyzzy/components/vector.js')

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

const Initializer = state => ({
    init: (canvas, scale) => {
        canvas.onmousedown = e => {
            if (!state.mousedown) state.mousedown = true
        }
        canvas.onmouseup = e => {
            if (state.mousedown) state.mousedown = false
        }
        canvas.onmouseenter = e => state.mousedown = false

        canvas.onmousemove = e => {
            b = canvas.getBoundingClientRect()
            state.coord.equ({
                x: e.clientX - b.left,
                y: e.clientY - b.top
            })
        }

    }
})

const Output = state => ({
    coord: scale => state.coord.div(scale).toFixed2d(2),
    isDown: () => state.mousedown
})

const Mouser = (element, scale) => {
    const state = {
        coord: new Vect(0, 0),
        mousedown: false
    }
    return Object.assign(
        {},
        Initializer(state),
        Output(state)
    )
}

module.exports = {
    MassHighlight,
    Mouser,
}