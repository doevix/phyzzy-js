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

const PropController = state => ({
    prop: (setPoint, feedback) => setPoint.sub(feedback).mul(state.kp)
})

const DiffController = state => ({
    diff: (setPoint, feedback, dt) => {
        const err = setPoint.sub(feedback)
        const errDiff = err.sub(state.diff_mem).div(dt)
        state.diff_mem.equ(err)
        return errDiff.mul(state.kd)
    },
    diffReset: () => state.diff_mem.clr()
})

const IntgController = state => ({
    intg: (setPoint, feedback, dt) => {
        const err = setPoint.sub(feedback)
        // self.err_int += (3 * err - self.intg_err_prv) * t_step / 2
        state.intg_mem.sumTo(
            err.mul(3).sub(state.intg_prv).mul(dt / 2)
        )
        state.intg_prv.equ(err)
        return state.intg_mem.mul(state.ki)
    },
    intgReset: () => {
        state.intg_mem.clr()
        state.intg_prv.clr()
    }
})

const Controller = (kp, ki, kd) => {
    // position controller
    const state = {
        kp,
        ki,
        kd,
        intg_mem: new Vect(0, 0),
        intg_prv: new Vect(0, 0),
        diff_mem: new Vect(0, 0)
    }
    return Object.assign(
        {},
        PropController(state),
        IntgController(state),
        DiffController(state)
    )
}

module.exports = {
    MassHighlight,
    Controller
}