// model_driver.js
'use strict';

v2d.prototype.draw = function(ctx, origin, scale) {
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + this.x * scale, origin.y + this.y * scale);
    ctx.closePath();
    ctx.stroke();
}

// Model driver singleton.
const Model = (() => {
    let masses = []; // Holds all masses to be used.
    let springs = []; // Holds all springs that link masses.
    
    let scale = 100; // Model scale in pixels per meter.
    let delta = 1 / 60; // Elapsed time between frames.

    // Elements under user influence.
    let highlight = undefined;
    let select = undefined;
    let drag = undefined;
    let pause = false;

    // Mass-mass collisions.
    const mm_collide = (m, preserve) => {
        for (let i = 0; i < masses.length; ++i) {
            const c = masses[i];
            if (m !== c && m.c_group === c.c_group && m.pos.isInRad(c.pos, m.radius + c.radius)) {
                const seg = m.pos.sub(c.pos);
                const D = seg.nrm().mul(m.radius + c.radius).sub(seg).div(2);

                const v_memA = {va: m.d_p(), vb: c.d_p()}
                const v_memB = {va: c.d_p(), vb: m.d_p()}
                
                m.pos.mAdd(D);
                c.pos.mSub(D);

                if (preserve) {
                    m.deflect(c, v_memA);
                    c.deflect(m, v_memB);
                }
            }
        }
    }
    // Mass-spring collisions.
    const ms_collide = m => {
        for (let i = 0; i < springs.length; ++i) {
            const s = springs[i];
            if (m.c_group === s.c_group && m !== s.mA && m !== s.mB) {
                const S = s.p_seg(m.pos, m.radius);
                if (S !== undefined) {
                    const R = S.nrm().mul(m.radius);
                    const D = R.sub(S);
                    m.pos.mSub(D.div(2));
                    s.mA.pos.mAdd(D.div(2));
                    s.mB.pos.mAdd(D.div(2));
                    m.prv.mAdd(D.div(2));
                    s.mA.prv.mSub(D.div(2));
                    s.mB.prv.mSub(D.div(2));
                }
            }
        }
    }

    return {
        isPaused: () => pause,
        togglePause: () => {
            if (pause) pause = false;
            else pause = true;
            return pause;
        },
        getScale: () => scale,
        setScale: set => scale = set,
        getDelta: () => delta,
        setDelta: set => delta = set,
        addMass: nMass => masses.push(nMass),
        remMass: mToRemove => {
            masses = masses.filter(m => m !== mToRemove);
            springs = springs.filter(s => s.mA !== mToRemove && s.mB !== mToRemove);
        },
        addSpring: nSpring => springs.push(nSpring),
        remSpring: sToRemove => springs = springs.filter(s => s !== sToRemove),
        update: (env) => {
            if (pause) return;
            // Apply model spring forces.
            for(let i = 0; i < springs.length; ++i) springs[i].apply_F(delta);
            
            // Update model state.
            for (let i = 0; i < masses.length; ++i) {
                const m = masses[i];
                // Model acceleration.
                m.F_sum.mAdd(env.g.mul(m.mass).add(m.get_v(delta).mul(-env.d).add(m.fric_prv)));
                env.screenFriction(m);
                m.v_accel(delta);
                m.F_sum.set();
                
                // Collision corrections.
                if (m.c_group > 0) {
                    ms_collide(m);
                    mm_collide(m, false);
                }
                env.boundCollide(m, false);
                env.s_boundHit(m, false);

                // Model inertia.
                m.v_iner();
                
                // Collision deflections.
                if (m.c_group > 0) {
                    mm_collide(m, true);
                }
                env.s_boundHit(m, true);
                env.boundCollide(m, true);
            }
        },
        nearestMass: (pos, rad) => masses.find(m => m.pos.isInRad(pos, m.radius + rad)),
        nearestSpring: (pos, rad) => springs.find(s => s.p_seg(pos, rad) !== undefined),
        setHighlight: element => highlight = element,
        setSelect: () => {
            select = highlight;
            drag = select;
            if (drag !== undefined)
            {
                if (drag.mA && drag.mB) {
                    drag.mA.ignore = true;
                    drag.mB.ignore = true;
                    drag.mA.prv.mEqu(drag.mA.pos);
                    drag.mB.prv.mEqu(drag.mB.pos);
                } else {
                    drag.ignore = true;
                    drag.prv.mEqu(drag.pos);
                }
            }
        },
        dragAction: (dx, dy) => {
            const D = new v2d(dx, dy);

            if (drag !== undefined) {
                drag.translate(D.div(scale), delta);
            }
        },
        clearDrag: () => {
            if (drag !== undefined) {
                if (drag.mA) {
                    drag.mA.ignore = false;
                    drag.mB.ignore = false;
                } else drag.ignore = false;
                drag = undefined
            }
        },
        draw: (ctx, theme) => {
            for (let i = 0; i < springs.length; ++i) {
                const s = springs[i];
                const widthHold = ctx.lineWidth;
                let s_color = theme.spring;
                if (s === highlight) {
                    ctx.lineWidth = 5
                    s_color = theme.s_highlighted;
                }
                if (s === select) {
                    ctx.lineWidth = 5
                    s_color = theme.s_selected;
                }
                ctx.strokeStyle = s_color;
                s.draw(ctx, scale);
                ctx.lineWidth = widthHold;
            };
            for (let i = 0; i < masses.length; ++i) {
                const m = masses[i];
                let m_color = theme.mass;
                let addedSize = 0;
                // Set user indicators.
                if (m === highlight) {
                    m_color = theme.m_highlighted;
                    addedSize = 0.01;
                }
                if (m === select) {
                    m_color = theme.m_selected;
                    addedSize = 0.015;
                }
                
                // Draw the mass.
                ctx.fillStyle = m_color;
                m.draw(ctx, scale, addedSize);
            };
        },
        export: (env) => JSON.stringify(
            { masses: masses, springs: springs, environment: env },
            function(key, value) {
                if (key !== 'mA' && key !== 'mB') return value;
                else return masses.indexOf(value);
            }, 4)
    };
})();