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
