// user.js
// mousing functions for user interaction
'use strict'
const Vect = require('./phyzzy/components/vector.js')
const highlightRadius = 5
const padding = 10

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

const Highlighter = state => ({
    hover: (phyzzy, ctx, hColor) => {
        ctx.strokeStyle = hColor || '#000000'
        state.hov = phyzzy.m.find(m => m.Pi.compare(state.coord.div(ph.scale), m.rad + padding / phyzzy.scale))
        if (state.hov) {
            ctx.beginPath()
            ctx.arc(
                state.hov.Pi.x * phyzzy.scale,
                state.hov.Pi.y * phyzzy.scale,
                state.hov.rad * phyzzy.scale + highlightRadius,
                0, 2 * Math.PI, false
            )
            ctx.stroke()
            ctx.closePath()
        }
        return state.hov
    },
    select: (scale, ctx, sColor) => {
        ctx.strokeStyle = sColor || '#000000'
        if (state.sel) {
            ctx.beginPath()
            ctx.arc(
                state.sel.Pi.x * scale,
                state.sel.Pi.y * scale,
                state.sel.rad * scale + highlightRadius,
                0, 2 * Math.PI, false
            )
            ctx.stroke()
            ctx.closePath()
        }
    } 
})

const Initializer = state => ({
    init: (canvas, scale) => {
        canvas.onmousedown = e => {
            if (!state.mousedown) state.mousedown = true
            
            const isOnHov = state.hov ?
            state.hov.Pi.compare(
                state.coord.div(scale), state.hov.rad + padding / scale
            ) : false

            if (isOnHov && state.sel != state.hov) {
                state.sel = state.hov
            } else state.sel = undefined
        }
        canvas.onmouseup = e => {
            if (state.mousedown) state.mousedown = false
        }
        canvas.onmouseenter = e => state.mousedown = false

        canvas.onmousemove = e => {
            const b = canvas.getBoundingClientRect()
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
        mousedown: false,
        hov: undefined,
        sel: undefined
    }
    return Object.assign(
        {},
        Initializer(state),
        Highlighter(state),
        Output(state)
    )
}

module.exports = {
    MassHighlight,
    Mouser,
}