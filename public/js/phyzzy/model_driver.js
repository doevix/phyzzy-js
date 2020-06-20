// model_driver.js
'use strict';

// Model driver singleton. Manages all movement, dynamics and user input.
const Model = (() => {
    const env = new Environment(new v2d(0, 0), 0);
    let masses = []; // Holds all masses to be used.
    let springs = []; // Holds all springs that link masses.
    
    let scale = 100; // Model scale in pixels per meter.
    let frameTime = 1 / 60;
    let stepsPerFrame = 1;
    let delta = frameTime / stepsPerFrame; // Elapsed time between frames.
    let collisions_enabled = false; // Free collisions disabled by default.
    
    // Actuator properties.
    let actuators = []; // Holds all active actuators.
    let amp = 0.5; // Wave amplitude.
    let wSpd = 0.5; // Wave speed.
    let dir = 1; // Wave direction.
    let t = 0; // Wave time.

    // Elements under user influence.
    let highlight = undefined;
    let select = undefined;
    let drag = undefined;
    let pause = false;

    // Mass-mass collisions
    const mm_collide = (m, preserve) => {
        for (let i = 0; i < masses.length; ++i) {
            const c = masses[i];
            // Check groups.
            if (m !== c && ((m.c_group === c.c_group && m.c_group !== 0 && c.c_group !== 0) || m.c_group === -1 || c.c_group === -1)) {
                // Check overlap.
                if (m.pos.isInRad(c.pos, m.radius + c.radius)) {
                    const seg = m.pos.sub(c.pos);
                    const D = seg.nrm().mul(m.radius + c.radius).sub(seg);

                    const v_memA = {va: m.d_p(), vb: c.d_p()}
                    const v_memB = {va: c.d_p(), vb: m.d_p()}
                    
                    if (!m.isFixed && !c.isFixed) {
                        m.pos.mAdd(D.div(2));
                        c.pos.mSub(D.div(2));
                    } else if(m.isFixed && !c.isFixed) {
                        c.pos.mSub(D);
                    } else if(!m.isFixed && c.isFixed) {
                        m.pos.mAdd(D);
                    }

                    if (preserve) {
                        if (!m.isFixed) m.deflect(c, v_memA);
                        if (!c.isFixed) c.deflect(m, v_memB);
                    }
                }
            }
        }
    }

    // Mass-spring collisions.
    const ms_collide = m => {
        for (let i = 0; i < springs.length; ++i) {
            const s = springs[i];
            // Check groups.
            if ((m !== s.mA && m !== s.mB) 
            && ((m.c_group === s.c_group && m.c_group !== 0 && s.c_group !== 0)|| m.c_group === -1 || s.c_group === -1)) {
                const S = s.p_seg(m.pos, m.radius);
                // Check overlap.
                if (S !== undefined) {
                    const R = S.nrm().mul(m.radius);
                    const D = R.sub(S);
                    
                    if (!m.isFixed && !s.mA.isFixed && !s.mB.isFixed) {
                        m.pos.mSub(D.div(2));
                        m.prv.mAdd(D.div(2));
                        s.mA.pos.mAdd(D.div(2));
                        s.mB.pos.mAdd(D.div(2));
                        s.mA.prv.mSub(D.div(2));
                        s.mB.prv.mSub(D.div(2));
                    } else if (m.isFixed) {
                        s.mA.pos.mAdd(D);
                        s.mB.pos.mAdd(D);
                        s.mA.prv.mSub(D);
                        s.mB.prv.mSub(D);
                    } else if (s.mA.isFixed || s.mB.isFixed) {
                        m.pos.mSub(D.div(2));
                        m.prv.mAdd(D.div(2));
                        
                    }
                }
            }
        }
    }
    
    // Autoreverse function.
    let autoRevEnable = true;
    let LR_prv = undefined;
    const toggleWaveDirection = () => dir = dir > 0 ? -1 : 1
    const autoReverse = LR => {
        if (autoRevEnable && LR !== undefined && LR !== LR_prv) {
            LR_prv = LR;
            toggleWaveDirection();
        }
    }

    const remSpring = sToRemove => {
        springs = springs.filter(s => s !== sToRemove);
        actuators = actuators.filter(a => a.acted !== sToRemove);
    }
    const remMass = mToRemove => {
        masses = masses.filter(m => m !== mToRemove);
        actuators = actuators.filter(a => a.acted !== mToRemove);
        springs.filter(s => s.mA === mToRemove || s.mB === mToRemove)
        .forEach(s => remSpring(s));
    }

    return {
        isPaused: () => pause,
        togglePause: () => {
            if (pause) pause = false;
            else pause = true;
            return pause;
        },
        toggleCollisions: () => {
            if (collisions_enabled) collisions_enabled = false;
            else collisions_enabled = true;
            return collisions_enabled;
        },
        getScale: () => scale,
        setScale: set => scale = set,
        getDelta: () => delta,
        setFrameTime: set => {
            frameTime = set;
            delta = frameTime / stepsPerFrame;
        },
        getFrameTime: () => frameTime = get,
        setStepsPerFrame: set => {
            stepsPerFrame = set
            delta = frameTime / stepsPerFrame;
        },
        getStepsPerFrame: () => stepsPerFrame,
        addMass: nMass => masses.push(nMass),
        addSpring: nSpring => {
            if (!springs.some(s => (nSpring.mA === s.mA && nSpring.mB === s.mB) || (nSpring.mA === s.mB && nSpring.mB === s.mA)))
                springs.push(nSpring);
            },
        remSpring,
        remMass,
        clear: () => {
            masses = [];
            springs = [];
            actuators = [];
            highlight = undefined;
            select = undefined;
            drag = undefined;
        },
        attachActuator: actuator => actuators.push(actuator),
        getActuator: element => actuators.find(a => element === a.acted),
        remActuator: aToRemove => {
            aToRemove.restore();
            actuators = actuators.filter(a => a !== aToRemove);
        },
        setWaveSpeed: n => wSpd = n,
        setWaveAmplitude: a => amp = a,
        getWaveStats: () => ({ amp, wSpd, t }),
        toggleWave: () => {
            LR_prv = undefined;
            toggleWaveDirection()
        },
        update: () => {
            if (pause) return;

            // Apply model actuators.
            for (let i = 0; i < actuators.length; i++) actuators[i].act(amp, 1, t);
            t += dir * wSpd * delta; // update actuator wave time.

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
                if (collisions_enabled)
                {
                    ms_collide(m);
                    mm_collide(m, false);
                    // m.m_collide(masses, false);
                }
                env.boundCollide(m, false);
                const LR = env.s_boundHit(m, false);
                autoReverse(LR); // Check if model wave should reverse direction.

                // Model inertia.
                m.v_iner();
                
                // Collision deflections.
                if (collisions_enabled)
                    // m.m_collide(masses, true);
                    mm_collide(m, true);

                env.s_boundHit(m, true);
                env.boundCollide(m, true);
            }
        },
        environment: () => env,
        nearestMass: (pos, rad) => masses.find(m => m.pos.isInRad(pos, m.radius + rad)),
        nearestSpring: (pos, rad) => springs.find(s => s.p_seg(pos, rad) !== undefined),
        getCenter: () => masses.reduce((c, m) => m.pos.add(c), new v2d()).div(masses.length),
        setHighlight: element => highlight = element,
        setSelect: () => {
            select = highlight;
            if (select) // drag can be either a spring or a mass.
                {
                    if (Spring.prototype.isPrototypeOf(select)) {
                        select.mA.ignore = true;
                        select.mB.ignore = true;
                        select.mA.prv.mEqu(select.mA.pos);
                        select.mB.prv.mEqu(select.mB.pos);
                    } else {
                        select.ignore = true;
                        select.prv.mEqu(select.pos);
                    }
                }
            drag = select;
            return select;
        },
        forceSelect: m => select = m,
        getHighlight: () => highlight,
        getSelect: () => select,
        dragAction: (dx, dy) => {
            const D = new v2d(dx, dy);
            if (drag !== undefined) {
                // Prevent velocity changes in pause mode when user moves elements.
                drag.translate(D.div(scale), !pause);
            }
        },
        clearDrag: () => {
            if (drag !== undefined) {
                if (Spring.prototype.isPrototypeOf(drag)) {
                    drag.mA.ignore = false;
                    drag.mB.ignore = false;
                } else {
                    drag.ignore = false;
                }
                drag = undefined;
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
                if (m.isFixed) {
                    ctx.fillStyle = theme.fixed_center;
                    m.draw(ctx, scale, -m.radius / 2);
                }
            };
        },
        export: () => JSON.stringify(
            { init: { environment: env, waveform: { amp, wSpd, t },
                scale, frameTime, stepsPerFrame, delta, collisions_enabled },
            masses, springs, actuators },
            function(key, value) {
                // Replace masses in spring with indices to masses.
                if (key === 'mA' || key === 'mB') return masses.indexOf(value);
                // Replace elements in actuator with their indices to arrays.
                else if (key === 'acted') {
                    let iAct = masses.indexOf(value);
                    if (iAct > 0) return iAct;
                    else return springs.indexOf(value);
                }
                else return value;
            }, 4),
        // Loads only bare model without environment or destroying current model.
        import: model => {
            const loaded = JSON.parse(model);
            const ml = masses.length;
            const sl = springs.length;
            
            loaded.masses.forEach(m => {
                const x = new Mass({ x: m.pos.x, y: m.pos.y }, m.radius, m.mass);
                x.prv.set(m.prv.x, m.prv.y);
                x.refl = m.refl;
                x.mu_s = m.mu_s;
                x.mu_k = m.mu_k;
                x.c_group = m.c_group;
                x.F_sum.mEqu(m.F_sum);
                x.fric_prv.mEqu(m.fric_prv);
                x.isFixed = m.isFixed;
                masses.push(x);
            });

            loaded.springs.forEach(s => {
                const x = new Spring(masses[ml + s.mA], masses[ml + s.mB], s.rst, s.stf, s.dmp);
                x.c_group = s.c_group;
                springs.push(x);
            });

            loaded.actuators.forEach(a => {
                let x;
                switch (a.type) {
                case 'SpringMuscle':
                    x = new MuscleSpringActuator(springs[sl + a.acted], a.phase, a.sense);
                    break;
                case 'SpringRelax':
                    x = new RelaxationSpringActuator(springs[sl + a.acted], a.phase, a.sense);
                    break;
                case 'MassBalloon':
                    x = new BalloonMassActuator(masses[ml + a.acted], a.phase, a.sense, a.mult);
                    break;
                case 'MassVary':
                    x = new VaryMassActuator(masses[ml + a.acted], a.phase, a.sense, a.mult);
                    break;
                }
                x.default = a.default;
                actuators.push(x);
            });
        }
    };
})();