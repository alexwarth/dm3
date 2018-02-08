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
    const text = this.isOn ? `Replay ${this.t}/${world.history.length - 1}` : 'debug mode';
    const width = ctxt.measureText(text).width;
    ctxt.fillText(text, window.innerWidth - width - 20, 30);
  }
};
