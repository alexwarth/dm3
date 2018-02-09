'use strict';

function stringify(x) {
  if (x === null || typeof x === 'number' || typeof x === 'undefined') {
    return '' + x;
  } else if (typeof x === 'string') {
    return JSON.stringify(x);
  } else if (typeof x === 'function') {
    return 'fn';
  } else if (x instanceof Array) {
    return '[' + x.map(stringify).join(', ') + ']';
  } else if (typeof x === 'object') {
    return '{' + Object.keys(x).map(k => k + ': ' + stringify(x[k])).join(', ') + '}';
  } else {
    console.info(typeof x, x);
    return '?';
  }
}

function seconds(s) {
  return new Promise(resolve => {
    setTimeout(resolve, s * 1000);
  });
}

function fillTextCenteredWithShadow(ctxt, text, centerX, centerY, height = 12) {
  const width = ctxt.measureText(text).width;
  const leftX = centerX - width / 2;
  const bottomY = centerY + height / 2;
  fillTextWithShadow(ctxt, text, leftX, bottomY);
}

function fillTextRightAlignedWithShadow(ctxt, text, rightX, bottomY) {
  const width = ctxt.measureText(text).width;
  const leftX = rightX - width;
  fillTextWithShadow(ctxt, text, leftX, bottomY);
}

function fillTextWithShadow(ctxt, text, leftX, bottomY) {
  const origFillStyle = ctxt.fillStyle;
  ctxt.fillStyle = 'black';
  ctxt.fillText(text, leftX + 2, bottomY + 2);
  ctxt.fillStyle = origFillStyle;
  ctxt.fillText(text, leftX, bottomY);
}
