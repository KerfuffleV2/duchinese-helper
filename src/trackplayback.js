function TrackPlayback(syls, stimes) {
  const me = this;

  this.pos = null;
  this.last = null;
  this.lastsent = null;
  this.lastword = null;

  // From https://stackoverflow.com/a/29018745 because I'm lazy.
  function binarySearch(ar, compare_fn) {
    let m = 0;
    let n = ar.length - 1;
    while (m <= n) {
      const k = (n + m) >> 1;
      const cmp = compare_fn(ar[k]);
      if (cmp > 0) {
        m = k + 1;
      } else if (cmp < 0) {
        n = k - 1;
      } else {
        return k;
      }
    }
    return -m - 1;
  }

  function findSyl(pos) {
    return Math.max(0, Math.abs(binarySearch(stimes, val => pos - val)) - 1);
  }

  this.update = function (pos) {
    if (!pos) {
      me.lastsent?.classList?.remove('dchactivesent');
      me.lastword?.classList?.remove('dchactiveword');
      me.last?.classList?.remove('dchactivesyl');
      me.lastsent = null;
      me.lastword = null;
      me.last = null;
      me.pos = null;
      return;
    }
    me.pos = pos;
    const idx = findSyl(pos);
    const currsyl = syls[idx];
    if (!currsyl) {
      return;
    }
    const [_cel, sel, wel, yel] = currsyl;
    if (me.lastsent !== sel) {
      me.lastsent?.classList?.remove('dchactivesent');
      me.lastsent = sel;
      sel?.classList?.add('dchactivesent');
    }
    if (me.lastword !== wel) {
      me.lastword?.classList?.remove('dchactiveword');
      me.lastword = wel;
      wel?.classList?.add('dchactiveword');
    }
    if (me.last !== yel) {
      me.last?.classList?.remove('dchactivesyl');
      me.last = yel;
      yel?.classList?.add('dchactivesyl');
    }
  };
}

export {TrackPlayback};
