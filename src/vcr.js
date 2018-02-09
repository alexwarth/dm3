'use strict';

const vcr = {
  isOn: false,
  t: null,

  turnOn() {
    this.isOn = true;
    world.saveToHistory();
    this.t = world.history.length - 1;
  },

  seek(t) {
    this.t = Math.max(0, Math.min(t, world.history.length - 1));
    world.restore(world.history[this.t]);
  },

  nextFrame() {
    this.seek(this.t + 1);
  },

  prevFrame() {
    this.seek(this.t - 1);
  },

  turnOff() {
    if (!this.isOn) {
      return;
    }
    this.isOn = false;
    this.t = null;
    world.restore(world.history[world.history.length - 1]);
    world.history.pop();
  },

  draw(ctxt) {
    if (!this.isOn && !debug) {
      return;
    }
    ctxt.font = '14pt Monaco';
    ctxt.fillStyle = 'yellow';
    const text = this.isOn ? `replay ${this.t}/${world.history.length - 1}` : 'debug mode';
    fillTextRightAlignedWithShadow(ctxt, text, window.innerWidth - 20, 30);
  }
};
