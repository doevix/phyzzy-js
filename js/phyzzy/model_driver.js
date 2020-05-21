// model_driver.js
'use strict';

// Simplifies drawing with v2d class.
// Draw arc, defaults to circle.
CanvasRenderingContext2D.prototype.v_arc = function(pos, rad, start = 0, end = 2 * Math.PI, counter = false) {
    this.arc(pos.x, pos.y, rad, start, end, counter);
}
// Draw line.
CanvasRenderingContext2D.prototype.v_line = function(A, B) {
    this.moveTo(A.x, A.y);
    this.lineTo(B.x, B.y);
}
// Draw square with radius like a circle.
CanvasRenderingContext2D.prototype.v_f_sqr = function(pos, r) {
    this.fillRect(pos.x - r, pos.y - r, r, r);
}
// Draws the vector on the screen.
v2d.prototype.draw = function(ctx, origin, scale) {
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + this.x * scale, origin.y + this.y * scale);
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
        this.c_group = 0; // Collision group. Equal values above 0 will collide.

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
    translate(D) {
        this.prv.mEqu(this.pos);
        this.pos.mEqu(this.pos.add(D));
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
        if (!this.ignore) {
            this.pos.mAdd(this.F_sum.div(this.mass).mul(delta * delta));
        }
    }
    // Verlet inertia application.
    v_iner() {
        if (!this.ignore) {
            const p = this.pos.mul(2).sub(this.prv);
            this.prv.mEqu(this.pos);
            this.pos.mEqu(p);
        }
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
        this.set_d_p(v1.sub(v1.sub(v2).pjt(this.pos.sub(mass2.pos)).mul(r * 2 * mass2.mass / (this.mass + mass2.mass))));
    }
    draw(ctx, scale, sum = 0) {
        const rad = (this.radius + sum) * scale;
        if (!this.isFixed) {
            ctx.beginPath();
            ctx.v_arc(this.pos.mul(scale), rad);
            ctx.closePath();
            ctx.fill();
        } else ctx.v_f_sqr(this.pos.mul(scale), rad * 2);
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
    translate(D) {
        this.mA.translate(D);
        this.mB.translate(D);
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
    F(delta) {
        const AB = this.mB.pos.sub(this.mA.pos);
        const l = AB.mag();
        // Springing force.
        const Fk = AB.div(l).mul((l - this.rst) * this.stf);
        // Damping force. I'm not sure if it's right for dragging, but it looks ok.
        const v_A = this.mA.d_p();
        const v_B = this.mB.d_p();
        const Fd = v_B.sub(v_A).div(delta).pjt(AB).mul(this.dmp);

        return Fk.add(Fd);
    }
    // Calculates forces and mutably sums to masses.
    apply_F(delta) {
        const F = this.F(delta);
        this.mA.F_sum.mAdd(F);
        this.mB.F_sum.mAdd(F.inv());
    }
    draw(ctx, scale) {
        ctx.beginPath();
        ctx.v_line(this.mA.pos.mul(scale), this.mB.pos.mul(scale));
        ctx.closePath();
        ctx.stroke();
    }
}

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
            const fk = m.d_p().x !== 0 ? Math.abs(m.F_sum.y) * m.mu_k * -(m.d_p().x / Math.abs(m.d_p().x)) : 0;
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