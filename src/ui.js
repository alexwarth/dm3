'use strict';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctxt = canvas.getContext('2d');

function renderLoop() {
  world.draw(ctxt);
  vcr.draw(ctxt);
  requestAnimationFrame(renderLoop);
}
renderLoop();

let t = 0;
async function stepLoop() {
  if (!vcr.isOn && world.beams.length === 0) {
    for (let obj of world.objects) {
      await obj.step(t);
    }
    t++;
    // Take a snapshot every .5 sec or so
    if (t % 30 === 0) {
      world.saveToHistory();
    }
  }
  requestAnimationFrame(stepLoop);
}
stepLoop();

document.body.addEventListener('keydown', e => {
  if (e.code === 'MetaLeft' && !vcr.isOn) {
    vcr.turnOn();
  }
});

let mouse = {x: -Infinity, y: -Infinity, buttonIsDown: false};

document.body.addEventListener('mousemove', e => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
  if (vcr.isOn) {
    vcr.seek(Math.floor(world.history.length * e.offsetX / window.innerWidth));
  } else if (mouse.targetObj) {
    mouse.targetObj.moveTo(
      mouse.x - mouse.targetObjOffsetX,
      mouse.y - mouse.targetObjOffsetY);
  }
});

/*
document.body.addEventListener('wheel', e => {
  e.preventDefault();
  if (!vcr.isOn) {
    return;
  }
  if (e.deltaX > 0) {
    vcr.prevFrame();
  } else if (e.deltaX === 0) {
    // no-op
  } else {
    vcr.nextFrame();
  }
});
*/

document.body.addEventListener('keyup', e => {
  if (e.code === 'MetaLeft') {
    vcr.turnOff();
  }
});

window.addEventListener('blur', e => {
  vcr.turnOff();
});

document.body.addEventListener('mousedown', e => {
  if (!vcr.isOn) {
    mouse.buttonIsDown = true;
    mouse.targetObj = null;
    for (let idx = world.objects.length - 1; idx >= 0; idx--) {
      const obj = world.objects[idx];
      if (!mouse.targetObj && obj.containsPoint(mouse.x, mouse.y)) {
        mouse.targetObj = obj;
        mouse.targetObjOffsetX = mouse.x - obj.state.x;
        mouse.targetObjOffsetY = mouse.y - obj.state.y;
        world.objects.splice(world.objects.indexOf(obj), 1);
        world.objects.push(obj);
      }
    }
  }
});

document.body.addEventListener('mouseup', e => {
  if (!vcr.isOn) {
    mouse.buttonIsDown = false;
    mouse.targetObj = null;
  }
});

// TODO: it would be great to resume program execution from whatever time is when exit VCR mode.
// (Would want to dump the rest of the history.) This is not super straightforward, though,
// because we would need to store a continuation in the snapshot -- need the stack, PC, etc.
// So probably not worth doing in this prototype.
