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

    const textDampingFactor = 0.45;
    ctxt.globalAlpha = Math.pow(textDampingFactor, this.beams.length - 1);
    ctxt.font = '12pt Avenir';
    for (let beam of this.beams) {
      illuminateMessageAvoidingBeam(ctxt, beam);
      if (beam.state.currentResult !== undefined) {
        illuminateResponseAvoidingBeam(ctxt, beam);
      }
      ctxt.globalAlpha /= textDampingFactor;
    }
    ctxt.globalAlpha = 1;
  }
}

// TODO: place labels so that they don't overlap with their resp. beams, if possible
// (not taking text measurements into account right now)

function illuminateMessageAvoidingBeam(ctxt, beam) {
  const sender = beam.state.sender;
  const text = `${beam.state.selector}(${beam.state.args.map(stringify).join(', ')})`;
  ctxt.fillStyle = 'yellow';
  if (!beam.containsPoint(sender.state.x, sender.topY - 20)) {
    fillTextCenteredWithShadow(ctxt, text, sender.state.x, sender.topY - 20);
  } else if (!beam.containsPoint(sender.state.x, sender.bottomY + 20)) {
    fillTextCenteredWithShadow(ctxt, text, sender.state.x, sender.bottomY + 20);
  } else if (!beam.containsPoint(sender.leftX - 20, sender.state.y)) {
    fillTextRightAlignedWithShadow(ctxt, text, sender.leftX - 20, sender.state.y);
  } else if (!beam.containsPoint(sender.rightX + 20, sender.state.y)) {
    fillTextLeftAlignedWithShadow(ctxt, text, sender.rightX + 20, sender.state.y);
  } else {
    fillTextCenteredWithShadow(ctxt, text, sender.state.x, sender.state.y);
  }
}

function illuminateResponseAvoidingBeam(ctxt, beam) {
  const receiver = beam.state.currentReceiver;
  const text = stringify(beam.state.currentResult);
  ctxt.fillStyle = 'white';
  if (!beam.containsPoint(receiver.state.x, receiver.bottomY + 20)) {
    fillTextCenteredWithShadow(ctxt, text, receiver.state.x, receiver.bottomY + 20);
  } else if (!beam.containsPoint(receiver.state.x, receiver.topY - 20)) {
    fillTextCenteredWithShadow(ctxt, text, receiver.state.x, receiver.topY - 20);
  } else if (!beam.containsPoint(receiver.rightX + 20, receiver.state.y)) {
    fillTextLeftAlignedWithShadow(ctxt, text, receiver.rightX + 20, receiver.state.y);
  } else if (!beam.containsPoint(receiver.leftX - 20, receiver.state.y)) {
    fillTextRightAlignedWithShadow(ctxt, text, receiver.leftX - 20, receiver.state.y);
  } else {
    fillTextCenteredWithShadow(ctxt, text, receiver.state.x, receiver.state.y);
  }
  fillTextCenteredWithShadow(
      ctxt,
      stringify(beam.state.currentResult),
      beam.state.currentReceiver.state.x,
      beam.state.currentReceiver.bottomY + 20);
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
