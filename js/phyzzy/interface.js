// interface for Phyzzy
'use strict'

const Mesh = {
    m = [],
    s = []
}

const Phyzzy = (viewport, scale) => {
    let state = {
        viewer = viewPort || null, // where to display. Null if omitted
        ctx = viewer.getContext('2d') || null, // canvas context
        scale = scale, // size of 1 meter in pixels
        play = false // false = paused, true = playing
    }
}