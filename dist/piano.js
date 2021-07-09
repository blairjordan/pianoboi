var diatonicScale = [2, 2, 1, 2, 2, 2, 1];
var centerPiano = function (s, t, c) {
    $(s).scrollLeft(((c * $(s)[0].scrollWidth) / t) - $(s).width() / 2);
};
var keyMarkup = function (k, m) {
    if (m === void 0) { m = ''; }
    return "<div class=\"key " + m + "\" data-keyno=\"" + k + "\"></div>";
};
var buildKeyboard = function (s, o, m, k) {
    for (var i = 0; i < o; i++) {
        diatonicScale.forEach(function (d, j) {
            $(s).append((d == 2) ? "" + keyMarkup(k++) + keyMarkup(k++, m) : keyMarkup(k++));
        });
    }
};
module.exports = { centerPiano: centerPiano, buildKeyboard: buildKeyboard };
//# sourceMappingURL=piano.js.map