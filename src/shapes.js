'use strict';

let debug = false;

document.body.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    debug = !debug;
  }
});

class Shape {
  constructor(x, y, color) {
    this.state = {x: x, y: y, color: color};
  }

  destroy() {
    const idx = world.objects.indexOf(this);
    if (idx < 0) {
      throw new Error('cannot destroy an object twice!');
    }
    world.objects.splice(idx, 1);
  }

  saveState() {
    // Note: this only copies own properties, so no delegation shenanigans!
    return Object.assign({}, this.state);
  }

  restoreState(oldState) {
    this.state = Object.assign({}, oldState);
  }

  moveTo(x, y) {
    this.state.x = x;
    this.state.y = y;
  }

  moveBy(dx, dy) {
    this.state.x += dx;
    this.state.y += dy;
  }

  get leftX() {
    throw new Error('subclass responsibility');
  }

  get rightX() {
    throw new Error('subclass responsibility');
  }

  get topY() {
    throw new Error('subclass responsibility');
  }

  get bottomY() {
    throw new Error('subclass responsibility');
  }

  containsPoint(x, y) {
    throw new Error('subclass responsibility');
  }

  overlapsWith(thatObj) {
    throw new Error('subclass responsibility');
  }

  drawBottomLayer(ctxt, options) {
    // no-op
  }

  draw(ctxt, options) {
    throw new Error('subclass responsibility');
  }

  drawTopLayer(ctxt, options) {
    // no-op
  }

  setStrokeStyle(ctxt, options) {
    if (!options) {
      return false;
    }
    if (options.isSender) {
      ctxt.strokeStyle = 'white';
      ctxt.lineWidth = 4;
      return true;
    } else if (options.isCurrentReceiver) {
      ctxt.strokeStyle = 'yellow';
      ctxt.lineWidth = 4;
      return true;
    } else if (options.isReceiver) {
      ctxt.strokeStyle = 'yellow';
      ctxt.lineWidth = 2;
      return true;
    } else {
      return false;
    }
  }

  get to() {
    return new ReceiverDescriptor(this);
  }

  async send(receiverDescriptor, selector, ...args) {
    const waitTimeSecs = .5;
    async function click() {
      world.saveToHistory();
      if (debug) {
        await seconds(waitTimeSecs);
      }
    }

    click();
    const beam = world.pushBeam(receiverDescriptor.toBeam(selector, args));

    function dist(a, b) {
      return Math.pow(
          Math.pow(a.state.x - b.state.x, 2) + Math.pow(a.state.y - b.state.y, 2),
          0.5);
    }

    beam.state.receivers = world.objects.
        filter(obj =>
            obj !== this &&
            obj instanceof receiverDescriptor.receiverType &&
            beam.overlapsWith(obj)).
        sort((a, b) => dist(a, beam.state.sender) - dist(b, beam.state.sender));
    beam.state.receivers.length = Math.min(
        beam.state.receivers.length,
        receiverDescriptor.maxNumReceivers);

    beam.state.currentReceiver = null;

    await click();

    const responses = [];
    try {
      for (beam.state.currentReceiver of beam.state.receivers) {
        await click();
        beam.state.currentResult = await beam.state.currentReceiver[selector](...args);
        responses.push({
            receiver: beam.state.currentReceiver,
            result: beam.state.currentResult});
        if (beam.state.currentResult !== undefined) {
          await click();
          beam.state.currentResult = undefined;
        }
      }
      if (beam.state.receivers.length > 0) {
        beam.state.currentReceiver = null;
        await click();
      }
      world.popBeam();
      return responses;
    } catch (e) {
      console.error(e);
      throw new Error('TODO: handle exceptions...');
    }
  }

  async step() {
    // no-op
  }

  async ping() {
    return 'pong';
  }
}

class Circle extends Shape {
  constructor(x, y, color, radius) {
    super(x, y, color);
    this.state.radius = radius;
  }

  get leftX() {
    return this.state.x - this.state.radius;
  }

  get rightX() {
    return this.state.x + this.state.radius;
  }

  get topY() {
    return this.state.y - this.state.radius;
  }

  get bottomY() {
    return this.state.y + this.state.radius;
  }

  containsPoint(x, y) {
    const dx = this.state.x - x;
    const dy = this.state.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.state.radius;
  }

  intersectsWithLine(x1, y1, x2, y2) {
    if (this.containsPoint(x1, y1) || this.containsPoint(x2, y2)) {
      return true;
    } else if (y1 === y2) {
      return this.topY <= y1 && y1 <= this.bottomY &&
             x1 <= this.leftX && this.rightX <= x2;
    } else if (x1 === x2) {
      return this.leftX <= x1 && x1 <= this.rightX &&
             y1 <= this.topY && this.bottomY <= y2;
    } else {
      console.error(x1, y1, x2, y2);
      throw new Error('TODO');
    }
  }

  overlapsWith(that) {
    if (that instanceof Rectangle) {
      return that.overlapsWith(this);
    } else if (that instanceof Circle) {
      const dx = this.state.x - that.state.x;
      const dy = this.state.y - that.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < this.state.radius + that.state.radius;
    } else {
      throw new Error('???');
    }
  }

  draw(ctxt, options) {
    ctxt.fillStyle = this.state.color;
    ctxt.beginPath();
    ctxt.arc(this.state.x, this.state.y, this.state.radius, 0, 2 * Math.PI);
    ctxt.fill();
    const oldLineWidth = ctxt.lineWidth;
    if (this.setStrokeStyle(ctxt, options)) {
      ctxt.stroke();
      ctxt.lineWidth = oldLineWidth;
    }
  }
}

class Rectangle extends Shape {
  constructor(x, y, color, width, height) {
    super(x, y, color);
    this.state.width = width;
    this.state.height = height;
  }

  get leftX() {
    return this.state.x - this.state.width / 2;
  }

  get rightX() {
    return this.state.x + this.state.width / 2;
  }

  get topY() {
    return this.state.y - this.state.height / 2;
  }

  get bottomY() {
    return this.state.y + this.state.height / 2;
  }

  containsPoint(x, y) {
    return this.leftX <= x && x < this.rightX &&
           this.topY <= y && y < this.bottomY;
  }

  overlapsWith(that) {
    if (that instanceof Rectangle) {
      return !(
          this.rightX < that.leftX ||
          this.leftX > that.rightX ||
          this.bottomY < that.topY ||
          this.topY > that.bottomY);
    } else if (that instanceof Circle) {
      return false ||
          this.containsPoint(that.state.x, that.state.y) ||
          that.intersectsWithLine(this.leftX, this.topY, this.rightX, this.topY) ||
          that.intersectsWithLine(this.leftX, this.topY, this.leftX, this.bottomY) ||
          that.intersectsWithLine(this.rightX, this.topY, this.rightX, this.bottomY) ||
          that.intersectsWithLine(this.leftX, this.bottomY, this.rightX, this.bottomY);
    } else {
      throw new Error('???');
    }
  }

  draw(ctxt, options) {
    ctxt.fillStyle = this.state.color;
    ctxt.fillRect(
        this.state.x - this.state.width / 2,
        this.state.y - this.state.height / 2,
        this.state.width,
        this.state.height);
    const oldLineWidth = ctxt.lineWidth;
    if (this.setStrokeStyle(ctxt, options)) {
      ctxt.strokeRect(
          this.state.x - this.state.width / 2,
          this.state.y - this.state.height / 2,
          this.state.width,
          this.state.height);
      ctxt.lineWidth = oldLineWidth;
    }
  }
}
