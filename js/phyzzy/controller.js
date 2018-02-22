'use strict'
const Vect = require('./components/vector.js')


const PropController = state => ({
    prop: (setPoint, feedback) => setPoint.sub(feedback).mul(state.kp)
})

const DiffController = state => ({
    diff: (setPoint, feedback, dt) => {
        const err = setPoint.sub(feedback)
        const errDiff = err.sub(state.diff_mem).div(dt)
        state.diff_mem.equ(err)
        return errDiff.mul(state.kd)
    }
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
    }
})

const Controller = (kp, ki, kd) => {
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

module.exports = Controller