const diatonicScale = [2,2,1,2,2,2,1];

const centerPiano = (s, t, c) => {
  $(s).scrollLeft(((c * $(s)[0].scrollWidth) / t) - $(s).width() / 2);
};

const keyMarkup = (k, m='') => `<div class="key ${m}" data-keyno="${k}"></div>`;

const buildKeyboard = (s, o, m, k) => {
  for (let i = 0; i < o; i++) {
    diatonicScale.forEach((d,j) => {
      $(s).append(
        (d == 2) ? `${keyMarkup(k++)}${keyMarkup(k++,m)}` : keyMarkup(k++)
      )
    });
  }
};

export {
  centerPiano,
  buildKeyboard
};