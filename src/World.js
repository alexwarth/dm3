'use strict';

const MAX_HISTORY_LENGTH = 1000;

class World {
  constructor() {
    this.objects = [];
    this.beams = [];
    this.history = [];
  }

  addObject(obj) {
    this.objects.push(obj);
    return obj;
  }

  pushBeam(beam) {
    this.beams.push(beam);
    return beam;
  }

  popBeam() {
    this.beams.pop();
  }

  saveToHistory() {
    if (this.history.length >= MAX_HISTORY_LENGTH) {
      this.history.shift();
    }
    this.history.push(this.save());
  }

  save() {
    return new Snapshot(
        this.objects.slice(),
        this.objects.map(obj => obj.saveState()),
        this.beams.slice(),
        this.beams.map(beam => beam.saveState()));
  }

  restore(snapshot) {
    for (let idx = 0; idx < snapshot.objects.length; idx++) {
      const obj = snapshot.objects[idx];
      const state = snapshot.objectStates[idx];
      obj.restoreState(state);
    }
    this.objects = snapshot.objects.slice();

    for (let idx = 0; idx < snapshot.beams.length; idx++) {
      const beam = snapshot.beams[idx];
      const state = snapshot.beamStates[idx];
      beam.restoreState(state);
    }
    this.beams = snapshot.beams.slice();
  }

  draw(ctxt) {
    ctxt.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const beamDampingFactor = 0.8;
    ctxt.globalAlpha = 0.25 * Math.pow(beamDampingFactor, this.beams.length - 1);
    for (let beam of this.beams) {
      beam.draw(ctxt);
      ctxt.globalAlpha /= beamDampingFactor;
    }
    ctxt.globalAlpha = 1;

    const topBeam = this.beams[this.beams.length - 1];
    for (let obj of this.objects) {
      const options = topBeam && {
        isSender: obj === topBeam.state.sender,
        isReceiver: topBeam.state.receivers.includes(obj),
        isCurrentReceiver: obj === topBeam.state.currentReceiver
      };
      obj.drawBottomLayer(ctxt, options);
    }
    for (let obj of this.objects) {
      const options = topBeam && {
        isSender: obj === topBeam.state.sender,
        isReceiver: topBeam.state.receivers.includes(obj),
        isCurrentReceiver: obj === topBeam.state.currentReceiver
      };
      obj.draw(ctxt, options);
    }
    for (let obj of this.objects) {
      const options = topBeam && {
        isSender: obj === topBeam.state.sender,
        isReceiver: topBeam.state.receivers.includes(obj),
        isCurrentReceiver: obj === topBeam.state.currentReceiver
      };
      obj.drawTopLayer(ctxt, options);
    }

    ctxt.font = '12pt Avenir';
    const textDampingFactor = 0.45;
    ctxt.globalAlpha = Math.pow(textDampingFactor, this.beams.length - 1);
    for (let beam of this.beams) {
      const label = `${beam.state.selector}(${beam.state.args.map(stringify).join(', ')})`;
      const width = ctxt.measureText(label).width;
      const height = 12;
      const x = beam.state.sender.state.x - width / 2;
      const y = beam.state.sender.state.y + height / 2;
      ctxt.fillStyle = 'black';
      ctxt.fillText(label, x + 2, y + 2);
      ctxt.fillStyle = 'yellow';
      ctxt.fillText(label, x, y);
      ctxt.globalAlpha /= textDampingFactor;
    }
    ctxt.globalAlpha = 1;
  }
}

class Snapshot {
  constructor(objects, objectStates, beams, beamStates) {
    this.objects = objects;
    this.objectStates = objectStates;
    this.beams = beams;
    this.beamStates = beamStates;
  }
}

const world = new World();
