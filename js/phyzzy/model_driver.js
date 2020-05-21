// model_driver.js
'use strict';

// Model driver singleton.
const Model = (() => {
    let masses = []; // Holds all masses to be used.
    let springs = []; // Holds all springs that link masses.
    let highlight = undefined;
    let select = undefined;

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

    const replacer = function(key, value) {
        let n;
        if (key !== 'mA' && key !== 'mB') return value;
        else return masses.indexOf(value);
    }

    return {
        addMass: nMass => masses.push(nMass),
        remMass: mToRemove => {
            masses = masses.filter(m => m !== mToRemove);
            springs = springs.filter(s => s.mA !== mToRemove && s.mB !== mToRemove);
        },
        addSpring: nSpring => springs.push(nSpring),
        remSpring: sToRemove => springs = springs.filter(s => s !== sToRemove),
        update: (env, delta) => {
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
        setSelect: () => select = highlight,
        draw: (ctx, theme, scale = 100) => {
            for (let i = 0; i < springs.length; ++i) {
                const s = springs[i];
                let s_color = theme.spring;
                if (s === highlight) s_color = theme.s_highlighted;
                if (s === select) s_color = theme.s_selected;
                ctx.strokeStyle = s_color;
                s.draw(ctx, scale);
            };
            for (let i = 0; i < masses.length; ++i) {
                const m = masses[i];
                let m_color = theme.mass;
                if (m === highlight) m_color = theme.m_highlighted;
                if (m === select) m_color = theme.m_selected;
                ctx.fillStyle = m_color;
                m.draw(ctx, scale);
            };
        },
        export: (env) => JSON.stringify({masses: masses, springs: springs, environment: env}, replacer, 4)
    };
})();