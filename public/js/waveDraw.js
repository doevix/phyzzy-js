// waveDraw.js
// Creates a wavebox to control wave properties and actuator phases.
"use strict"

const sineWave = (amp, wSpd, t, phase) => (1 + amp * Math.sin(wSpd * t + phase)) / 2;

const wbox = {
    segments: 25,
    divisions: 4,
    wavebox: document.getElementById("wavebox"),
    wctx: this.wavebox.getContext("2d"),
    ampSlider: document.getElementById("amplitude"),
    spdSlider: document.getElementById("speed"),
    dirCheck: document.getElementById("direction"),
    draw: function(amplitude, waveSpeed, time) {
        this.wctx.clearRect(0, 0, this.wavebox.width, this.wavebox.height);
        this.wctx.fillStyle = "#CFCFCF";
        this.wctx.beginPath();
        for (let i = 0; i <= this.segments; i++)
        {
            const segX = i / this.segments;
            const f = sineWave(amplitude, waveSpeed, time, 2 * Math.PI * segX);
            if (i === 0) this.wctx.moveTo(wavebox.width * segX, f * wavebox.height);
            else this.wctx.lineTo(this.wavebox.width * segX, f * this.wavebox.height);
        }
        this.wctx.lineTo(this.wavebox.width, this.wavebox.height);
        this.wctx.lineTo(0, this.wavebox.height);
        this.wctx.closePath();
        this.wctx.fill();

        this.wctx.lineWidth = 0.5;
        this.wctx.strokeStyle = "rgba(0, 0, 0, 0.8)"
        this.wctx.beginPath();
        this.wctx.moveTo(0, this.wavebox.height / 2);
        this.wctx.lineTo(this.wavebox.width, this.wavebox.height / 2);
        this.wctx.closePath();
        this.wctx.stroke();

        this.wctx.lineWidth = 0.3;
        for (let i = 1; i < this.divisions; i++) {
            const sX = i / this.divisions;
            this.wctx.beginPath();
            this.wctx.moveTo(sX * this.wavebox.width, 0);
            this.wctx.lineTo(sX * this.wavebox.width, this.wavebox.height);
            this.wctx.closePath();
            this.wctx.stroke();
        }
    }
};