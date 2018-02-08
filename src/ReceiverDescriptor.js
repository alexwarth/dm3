'use strict';

class ReceiverDescriptor {
  constructor(sender) {
    this.sender = sender;
  }

  all(optReceiverType) {
    return this.upTo(Infinity, optReceiverType);
  }

  one(optReceiverType) {
    return this.upTo(1, optReceiverType);
  }

  upTo(maxNumReceivers, optReceiverType) {
    this._set('maxNumReceivers', maxNumReceivers);
    this._set('receiverType', optReceiverType);
    return this;
  }

  left(optMaxDistance) {
    this._set('direction', 'left');
    this._set('maxDistance', optMaxDistance);
    return this;
  }

  right(optMaxDistance) {
    return this.direction('right', optMaxDistance);
  }

  up(optMaxDistance) {
    return this.direction('up', optMaxDistance);
  }

  down(optMaxDistance) {
    return this.direction('down', optMaxDistance);
  }

  nearby(optMaxDistance) {
    return this.direction('nearby', optMaxDistance);
  }

  direction(direction, optMaxDistance) {
    this._set('direction', direction);
    this._set('maxDistance', optMaxDistance);
    return this;
  }

  _set(prop, optValue) {
    if (optValue === undefined) {
      // no-op
    } else if (this.hasOwnProperty(prop) && this[prop] !== optValue) {
      throw new Error('conflicting values for ' + prop);
    } else {
      this[prop] = optValue;
    }
  }

  async send(selector, ...args) {
    this.fillInDefaults();
    return await this.sender.send(this, selector, ...args);
  }

  fillInDefaults() {
    if (!this.hasOwnProperty('maxNumReceivers')) {
      this.maxNumReceivers = Infinity;
    }
    if (!this.hasOwnProperty('direction')) {
      this.direction = 'nearby';
    }
    if (!this.hasOwnProperty('receiverType')) {
      this.receiverType = Shape;
    }
    if (!this.hasOwnProperty('maxDistance')) {
      this.maxDistance = Infinity;
    }
  }

  toBeam(selector, args) {
    let beam;
    switch (this.direction) {
      case 'up': {
        const beamHeight = Math.min(this.maxDistance, this.sender.state.y);
        beam = new Rectangle(
          this.sender.state.x,
          this.sender.state.y - beamHeight / 2,
          'yellow',
          this.sender.rightX - this.sender.leftX,
          beamHeight);
        break;
      }
      case 'down': {
        const beamHeight = Math.min(this.maxDistance, canvas.height - this.sender.state.y);
        beam = new Rectangle(
          this.sender.state.x,
          this.sender.state.y + beamHeight / 2,
          'yellow',
          this.sender.rightX - this.sender.leftX,
          beamHeight);
        break;
      }
      case 'left': {
        const beamWidth = Math.min(this.maxDistance, this.sender.state.x);
        beam = new Rectangle(
          this.sender.state.x - beamWidth / 2,
          this.sender.state.y,
          'yellow',
          beamWidth,
          this.sender.bottomY - this.sender.topY);
        break;
      }
      case 'right': {
        const beamWidth = Math.min(this.maxDistance, canvas.width - this.sender.state.x);
        beam = new Rectangle(
          this.sender.state.x + beamWidth / 2,
          this.sender.state.y,
          'yellow',
          beamWidth,
          this.sender.bottomY - this.sender.topY);
        break;
      }
      case 'nearby': {
        const maxDistance = Math.min(
            this.maxDistance,
            2 * Math.max(canvas.width, canvas.height));
        beam = new Circle(this.sender.state.x, this.sender.state.y, 'yellow', maxDistance);
        break;
      }
      default: {
        console.log(typeof this.direction, this.direction);
        throw new Error('unknown direction ' + this.direction);
      }
    }
    beam.state.sender = this.sender;
    beam.state.selector = selector;
    beam.state.args = args;
    return beam;
  }
}
