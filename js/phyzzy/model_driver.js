// model_driver.js
'use strict';

// Draws the vector on the screen.
v2d.prototype.draw = function(ctx, origin, scale) {
    const v = this.mul(scale);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + p.x, origin.y + p.y);
    ctx.closePath();
    ctx.stroke();
}

// Masses: Has weight and reacts to forces and velocity. Moved via verlet integrator.
class Mass {
    constructor(pos, radius = 0.08, mass = 0.16) {
        this.mass = mass;
        this.radius = radius;
        this.pos = new v2d(pos.x, pos.y); // Current position.
        this.prv = new v2d(pos.x, pos.y); // Previous position.

        // These are default values expected to be rarely changed.
        this.refl = 0.75; // Surface reflection.
        this.mu_s = 0.8; // Static friction coefficient.
        this.mu_k = 0.3; // Dynamic friction coefficient.

        // Collision group.
        // Every mass and spring is found inside a collision group.
        // When in group -1 the mass or spring will collide with any other
        // element regardless of group.
        // When in group 0, the mass or spring will not collide with any
        // other element other than in group -1.
        // When in any group above 0, the mass or spring will only collide
        // against any element in the same group as well as group -1.
        this.c_group = 0;

        // Forces that can't be accumulated instantaneously (springs & surface friction).
        this.F_sum = new v2d();
        this.fric_prv = new v2d();

        // Allows the mass to ignore dynamics from integrator loop.
        this.isFixed = false;
        this.ignore = false;
    }
    // Get segment of previous to current position.
    d_p() {
        return this.pos.sub(this.prv);
    }
    // Set previous position according to a given segment.
    set_d_p(d_p = new v2d()) {
        this.prv.mEqu(this.pos.sub(d_p));
    }
    // Translates the mass by a difference in movement.
    translate(D, preserve_vel = true) {
        let p = this.pos.copy();
        this.pos.mAdd(D);
        this.prv.mEqu(preserve_vel ? p : this.pos);
    }
    // Get mass velocity [m/s]
    get_v(delta) {
        return this.pos.sub(this.prv).div(delta);
    }
    // Set mass to a given velocity [m/s]
    set_v(v, delta) {
        this.prv.mEqu(this.pos.sub(v.mul(delta)));
    }
    // Verlet integrator acceleration.
    v_accel(delta) {
        if (!this.ignore && !this.isFixed) {
            this.pos.mAdd(this.F_sum.div(this.mass).mul(delta * delta));
        } else {
            this.prv.mEqu(this.pos);
        }
    }
    // Verlet inertia application.
    v_iner() {
            const p = this.pos.mul(2).sub(this.prv);
            this.prv.mEqu(this.pos);
            this.pos.mEqu(p);
    }
    // Calculate and accumulate surface friction.
    f_k(S) {
        // To to: make this work correctly.
        const F_S = this.F_sum.pjt(S);
        const V_S = this.d_p().pjt(S);
        const F_Sp = this.F_sum.pjt(S.prp());
        const V_Sp = this.d_p().pjt(S.prp());

        const fk = V_S.inv().nrm().mul(this.mu_k * F_Sp.mag());
        console.log(fk);
        this.F_sum.mAdd(fk);
    }
    // Reflect mass's velocity according to a tangent direction.
    reflect(tan) {
        this.set_d_p(this.d_p().pjt(tan).add(this.d_p().pjt(tan.prp()).inv().mul(this.refl)));
    }
    // Deflect mass from collision with other mass.
    deflect(mass2, mem) {
        const v1 = mem ? mem.va : this.d_p();
        const v2 = mem ? mem.vb : mass2.d_p();
        const r = (this.refl + mass2.refl) / 2;
        this.set_d_p(v1.sub(v1.sub(v2).pjt(this.pos.sub(mass2.pos))
        .mul(r * 2 * mass2.mass / (this.mass + mass2.mass))));
    }
    draw(ctx, scale, sum = 0) {
        const rad = (this.radius + sum) * scale;
        const p = this.pos.mul(scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
};

// Spring. Holds two existing masses and acts on them to simulate a spring.
class Spring {
    constructor(mA, mB, restlength, stiffness = 50, damping = 5) {
        this.mA = mA;
        this.mB = mB;
        this.rst = restlength;
        this.stf = stiffness;
        this.dmp = damping;
        this.c_group = 0; // Collision group. Equal values above 0 will collide.
    }
    translate(D, preserve_vel = true) {
        this.mA.translate(D, preserve_vel);
        this.mB.translate(D, preserve_vel);
    }
    // Returns the spring's geometric center.
    centroid() {
        return this.mA.pos.add(this.mB.pos).div(2);
    }
    // Returns the spring's center of mass.
    m_center() {
        return this.mA.pos.mul(this.mA.mass).add(this.mB.pos.mul(this.mB.mass)).div(2 * (this.mA.mass + this.mB.mass));
    }
    // Returns perpendicular segment to a given point. Returns undefined if point is not within range.
    p_seg(P, rad) {
        const AB = this.mB.pos.sub(this.mA.pos);
        const l = AB.mag2();
        const AP = P.sub(this.mA.pos);
        const BP = P.sub(this.mB.pos);
        const isInRange = AP.mag2() < l && BP.mag2() < l;
        const S = AP.pjt(AB).sub(AP)
        return isInRange && S.mag2() < rad * rad ? S : undefined;
    }
    // Returns resulting force respect to mA.
    Fs(delta) {
        const AB = this.mB.pos.sub(this.mA.pos);
        const l = AB.mag();
        // Springing force.
        return AB.div(l).mul((l - this.rst) * this.stf);
    }
    Fd_A(delta) {
        // Damping force.
        const AB = this.mB.pos.sub(this.mA.pos);
        const v_A = this.mA.d_p();
        const v_B = this.mB.d_p();
        return v_B.sub(v_A).div(delta).pjt(AB).mul(this.dmp);
    }
    Fd_B(delta) {
        // Damping force.
        const AB = this.mB.pos.sub(this.mA.pos);
        const v_A = this.mA.d_p();
        const v_B = this.mB.d_p();
        return v_A.sub(v_B).div(delta).pjt(AB).mul(this.dmp);
    }
    // Calculates forces and mutably sums to masses.
    apply_F(delta) {
        const Fs = this.Fs();
        this.mA.F_sum.mAdd(Fs.add(this.Fd_A(delta)));
        this.mB.F_sum.mAdd(Fs.inv().add(this.Fd_B(delta)));
    }
    draw(ctx, scale) {
        const pA = this.mA.pos.mul(scale);
        const pB = this.mB.pos.mul(scale);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.closePath();
        ctx.stroke();
    }
}

// Classic restlength-modifying muscle.
class MuscleSpringActuator
{
    constructor(spring, phase = 0, sense = 0.5) {
        this.spring = spring;
        this.phase = phase;
        this.sense = sense;

        this.default = spring.rst;
    }
    act(amp, wSpd, t)
    {
        const factor = 1 + Math.sin(wSpd * t + (this.phase / Math.abs(wSpd)));
        this.spring.rst = this.default * (1 + amp * this.sense * factor);
    }
    restore()
    {
        this.spring.rst = this.default;
    }
};

// Actuators. The following classes modify element properties according to a waveform.
// Relaxation stiffness-modifying muscle.
class RelaxationSpringActuator
{
    constructor(spring, phase = 0, sense = 0.5) {
        this.spring = spring;
        this.phase = phase;
        this.sense = sense;

        this.default = spring.stf;
    }
    act(amp, wSpd, t) {
        // Muscle stiffness travels from default value to a lower value.
        const factor = (1 + Math.sin(wSpd * t + this.phase / Math.abs(wSpd))) / 2;
        this.spring.stf = this.default * amp * (1 - factor);
    }
    restore()
    {
        this.spring.stf = this.default;
    }
};
// Modifies mass radius by waveform.
class BalloonMassActuator {
    constructor(mass, phase = 0, sense = 0.5, multiplier = 1) {
        this.mass = mass;
        this.phase = phase;
        this.sense = sense;
        this.mult = multiplier; // Max times the mass's radius increases by.

        this.default = mass.radius;
    }
    act(amp, wSpd, t) {
        const factor = (1 + Math.sin(wSpd * t + this.phase / Math.abs(wSpd))) / 2;
        this.mass.radius = this.default * (1 + this.mult * amp * this.sense * factor);
    }
    restore() {
        this.mass.radius = this.default;
    }
};
// Modifies mass's mass by waveform.
class VaryMassActuator {
    constructor(mass, phase = 0, sense = 0.5, multiplier = 1) {
        this.mass = mass;
        this.phase = phase;
        this.sense = sense;
        this.mult = multiplier; // Max times the mass's radius increases by.

        this.default = mass.mass;
    }
    act(amp, wSpd, t) {
        const factor = (1 + Math.sin(wSpd * t + this.phase / Math.abs(wSpd))) / 2;
        this.mass.mass = this.default * (1 + this.mult * amp * this.sense * factor);
    }
    restore() {
        this.mass.mass = this.default;
    }
};

// Environment that acts on the model.
class Environment {
    constructor(gravity = new v2d(), drag = 0, x = undefined, y = undefined, w = undefined, h = undefined)
    {
        this.g = gravity;
        this.d = drag;
        this.bounds = [];
        this.s_bounds = { x: x, y: y, w: w, h: h };
    }
    addBound(A, B) {
        this.bounds.push({ A: new v2d(A.x, A.y), B: new v2d(B.x, B.y) });
    }
    boundCollide(m, preserve) {
        for (let i = 0; i < this.bounds.length; i++) {
            const b = this.bounds[i];
            const AB = b.B.sub(b.A);
            const AP = m.pos.sub(b.A);
            const BP = m.pos.sub(b.B);
            const pjt = AP.pjt(AB);
            if (pjt.isInRad(AP, m.radius) && AB.isGreater(AP) && AB.isGreater(BP)
            || b.A.isInRad(m.pos, m.radius) || b.B.isInRad(m.pos, m.radius)) {
                const S = pjt.sub(AP);
                const R = S.nrm().mul(m.radius);
                const T = R.sub(S);
                // Reposition mass.
                m.pos.mSub(T);
                m.prv.mSub(T);
                if (preserve) m.reflect(AB);
            }
        }
    }
    // Screen bounds.
    s_boundHit(m, preserve) {
        const d_horz = new v2d(1, 0); // Horizontal direction
        const d_vert = new v2d(0, 1); // Vertical direction
        if (this.s_bounds.h !== undefined && m.pos.y + m.radius > this.s_bounds.h) {
            const p_temp = m.pos.y;
            m.pos.y = this.s_bounds.h - m.radius;
            m.prv.y += m.pos.y - p_temp;
            if (preserve) m.reflect(d_horz);
        } else if (this.s_bounds.y !== undefined && m.pos.y - m.radius < this.s_bounds.y) {
            const p_temp = m.pos.y;
            m.pos.y = this.s_bounds.y + m.radius;
            m.prv.y += m.pos.y - p_temp;
            if (preserve) m.reflect(d_horz);
        }
        if (this.s_bounds.w !== undefined && m.pos.x + m.radius > this.s_bounds.w) {
            const p_temp = m.pos.x;
            m.pos.x = this.s_bounds.w - m.radius;
            m.prv.x += m.pos.x - p_temp;
            if (preserve) m.reflect(d_vert);
        } else if (this.s_bounds.x !== undefined && m.pos.x - m.radius < this.s_bounds.x) {
            const p_temp = m.pos.x;
            m.pos.x = this.s_bounds.x + m.radius;
            m.prv.x += m.pos.x - p_temp;
            if (preserve) m.reflect(d_vert);
        }
    }
    screenFriction(m) {
        if (this.s_bounds.h != undefined && m.pos.y + m.radius >= this.s_bounds.h) {
            const magX = Math.abs(m.d_p().x);
            const fk = magX > 0 ? Math.abs(m.F_sum.y) * m.mu_k * -(m.d_p().x / magX) : 0;
            m.F_sum.x += fk;
        }
    }
    draw(ctx, color, scale = 100) {
        ctx.strokeStyle = color;
        for (let b of this.bounds) {
            ctx.beginPath();
            ctx.moveTo(b.A.x * scale, b.A.y * scale);
            ctx.lineTo(b.B.x * scale, b.B.y * scale);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

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

    // Mass-mass collisions.
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
        remMass: mToRemove => {
            masses = masses.filter(m => m !== mToRemove);
            springs = springs.filter(s => s.mA !== mToRemove && s.mB !== mToRemove);
        },
        addSpring: nSpring => {
            if (!springs.some(s =>
                (nSpring.mA === s.mA && nSpring.mB === s.mB) || (nSpring.mA === s.mB && nSpring.mB === s.mA)))
                springs.push(nSpring)
        },
        remSpring: sToRemove => springs = springs.filter(s => s !== sToRemove),
        attachActuator: actuator => actuators.push(actuator),
        getActuator: element => actuators.find(a => {
            if (Spring.prototype.isPrototypeOf(element))
                return a.spring === element;
            else return a.mass === element;
        }),
        remActuator: aToRemove => {
            aToRemove.restore();
            actuators = actuators.filter(a => a !== aToRemove);
        },
        setWaveSpeed: n => wSpd = n,
        setWaveAmplitute: a => amp = a,
        toggleWaveDirection: () => dir = dir > 0 ? -1 : 1,
        update: () => {
            if (pause) return;

            // Apply model actuators.
            for (let i = 0; i < actuators.length; i++) actuators[i].act(amp, 1, t);
            t += wSpd * delta; // update actuator wave time.

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
                }
                env.boundCollide(m, false);
                env.s_boundHit(m, false);

                // Model inertia.
                m.v_iner();
                
                // Collision deflections.
                if (collisions_enabled)
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
            { init: {scale, frameTime, stepsPerFrame, delta, collisions_enabled},
            masses, springs, environment: env },
            function(key, value) {
                if (key !== 'mA' && key !== 'mB') return value;
                else return masses.indexOf(value);
            }, 4)
    };
})();