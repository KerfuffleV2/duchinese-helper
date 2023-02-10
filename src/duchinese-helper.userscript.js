// ==UserScript==
// @name        DC Helper
// @namespace   Violentmonkey Scripts
// @match       https://duchinese.net/*
// @version     0.5
// @run-at      document-start
// @inject-into page
// @grant       GM_setClipboard
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_addValueChangeListener
// @author      KerfuffleV2
// @description Unsupported extensions for DuChinese
// ==/UserScript==

// const PinyinConverter = require('./pinyin_converter.ts').PinyinConverter;
// console.log(PinyinConverter.split_pinyin('zhuang'));
// console.log('DERP', PinyinConverter);

import {
  applyStyles,
  // ConfigKVs,
  // ConfigOption,
  configOptions,
  defaultConfig,
} from './config.ts';
import {PinyinConverter} from './pinyin_converter.ts';

let configuration;
const bus = new EventTarget();

function mkElementTree(typ, attrs, children) {
  const el = document.createElement(typ);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v ?? ''));
  }
  if (!children) {
    return el;
  }
  if (typeof children === 'string') {
    children = [children];
  }

  for (const child of children) {
    switch (typeof child) {
      case 'string':
        el.appendChild(document.createTextNode(child));
        break;
      case 'object':
        if (child instanceof Element) {
          el.appendChild(child);
        } else if (typeof child.typ === 'string') {
          el.appendChild(mkElementTree(child.typ, child.attrs, child.children));
        }
        break;
    }
  }
  return el;
}

function Config() {
  const me = this;

  const cfg = GM_getValue('config') ?? defaultConfig;
  for (const k of Object.keys(defaultConfig)) {
    const val = cfg[k] ?? undefined;
    if (val === undefined || !configOptions[k]?.options.includes(val)) {
      cfg[k] = defaultConfig[k];
    }
  }

  me.cfg = cfg;

  me.get = name => cfg[name];

  function makeOption(name, option) {
    const el = document.createElement('label');
    const sel = document.createElement('select');
    sel.setAttribute('name', name);
    sel.addEventListener('change', evt => {
      me.cfg[name] = JSON.parse(evt.target.value);
      bus.dispatchEvent(new CustomEvent('configupdate', {detail: me}));
    });
    el.appendChild(document.createTextNode(`${option.name ?? name}: `));
    el.setAttribute('class', 'dchoptlabel');
    for (const optval of option.options) {
      const oel = document.createElement('option');
      oel.setAttribute('value', JSON.stringify(optval));
      const currval = cfg[name] ?? null;
      if (currval === optval) {
        oel.setAttribute('selected', '');
      }
      oel.appendChild(document.createTextNode(`${optval}`));
      sel.appendChild(oel);
    }
    el.appendChild(sel);
    return el;
  }

  function initElement() {
    const el = document.createElement('div');
    el.setAttribute('id', 'dchelper-config');
    el.setAttribute('hidden', '');
    for (const [ok, ov] of Object.entries(configOptions)) {
      el.appendChild(makeOption(ok, ov));
    }
    const pel = document.createElement('p');
    {
      const lel = document.createElement('a');
      lel.setAttribute('href', '#0');
      lel.appendChild(document.createTextNode('[Save]'));
      lel.addEventListener('click', _evt => {
        GM_setValue('config', me.cfg);
        return false;
      });
      pel.appendChild(lel);
      el.appendChild(pel);
    }
    pel.appendChild(document.createTextNode(' | '));
    {
      const lel = document.createElement('a');
      lel.setAttribute('href', '#0');
      lel.appendChild(document.createTextNode('[Clear]'));
      lel.addEventListener('click', _evt => {
        GM_deleteValue('config');
        return false;
      });
      pel.appendChild(lel);
    }
    el.appendChild(pel);
    return el;
  }

  me.element = initElement();
}

function DCHState() {
  const me = this;

  this.reset = function () {
    if (me.helper) {
      me.helper.reset();
    }
    me.helper = null;
    me.audio = null;
    me.crd = null;
    me.name = null;
    me.ready = false;
    console.log('DCH: UNREADY');
  };

  function checkReady() {
    const wasReady = me.ready;
    me.ready = me.name && me.crd && me.audio;
    if (me.ready && !wasReady) {
      me.helper = new DCHelper(me.name, me.audio, me.crd);
    }
  }

  this.updateName = function (onlyUnset) {
    if (onlyUnset && me.name !== null) {
      return;
    }
    me.reset();
    if (!document.location.pathname.startsWith('/lessons/')) {
      return;
    }
    const urlParams = new URLSearchParams(document.location.search);
    const chapNum = urlParams.get('chapter');
    const chapName = document.location.pathname.split('/');
    me.name = `${chapName[chapName.length - 1]}${chapNum ? `.${chapNum}` : ''}`;
    console.log('DCH: NAME', me.name);
  };

  this.setAudio = function (audio) {
    me.audio = audio;
    checkReady();
  };

  this.setCrd = function (crd) {
    me.crd = crd;
    checkReady();
  };

  if (document.location.pathname.startsWith('/lessons/')) {
    me.updateName();
  } else {
    me.reset();
  }

  GM_registerMenuCommand('Refresh', () => {
    if (me.helper && me.crd) {
      applyStyles(configuration.cfg);
      document.getElementById('dchelper-container')?.remove();
      me.helper.update();
    } else {
      document.getElementById('dchelper-styles')?.remove();
      document.getElementById('dchelper-container')?.remove();
    }
  });
}

function DCDocState(dchst) {
  let oldNav = [document.location.pathname, document.location.search];

  function checkAudio() {
    if (dchst.name === null || dchst.audio !== null) {
      return;
    }
    const ael = document.querySelector('audio > source[type="audio/mpeg"]');
    if (ael) {
      dchst.setAudio(ael);
    }
  }

  const observer = new MutationObserver(_mutations => {
    const currNav = [document.location.pathname, document.location.search];
    const didnav = oldNav[0] !== currNav[0] || oldNav[1] !== currNav[1];
    if (didnav) {
      console.log('DCH: NAVIGATE', oldNav, currNav);
      oldNav = currNav;
    }
    dchst.updateName(!didnav);
    checkAudio();
  });

  function observe() {
    observer.disconnect();
    const body = document.querySelector('body');
    if (!body) {
      console.log('DCH: No body.');
      return;
    }
    observer.observe(body, {childList: true, subtree: true});
  }

  this.reset = function () {
    dchst.reset();
    observer.disconnect();
    window.removeEventListener('load', observe);
  };

  this.updateCRD = function (responseText) {
    dchst.setCrd(responseText);
    checkAudio();
  };

  window.addEventListener('load', observe);
}

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

class Vocabulary {
  constructor(syls, words) {
    this.hskWords = new Array(12);
    const slist = syls.i,
      slen = slist.length;
    let uniquewordcount = 0,
      wordcount = 0,
      hskwordcount = 0,
      namecount = 0;
    let hsktotal = 0,
      onlyhsktotal = 0;
    for (let idx = 0; idx < slen; ) {
      const {word, phon, hsk, _firstseen} = slist[idx];
      const wsyls = new Array();
      for (; idx < slen && slist[idx].word === word; idx++) {
        wsyls.push(slist[idx]);
      }
      const currword = words[word];
      if (!phon || !currword || !currword.meaning || !currword.pinyin) {
        continue;
      }
      const [hskidx, hsklevel] =
        hsk > 0 && hsk < 10
          ? [hsk - 1, hsk]
          : PinyinConverter.is_name(currword.pinyin, currword.meaning)
          ? [11, 0]
          : [10, 10];
      if (hsklevel === 11) {
        namecount++;
      } else if (hsklevel > 0) {
        hsktotal += hsklevel;
        wordcount++;
        if (hsk && hsklevel < 10) {
          onlyhsktotal += hsk;
          hskwordcount++;
        }
      }
      let wm = this.hskWords[hskidx];
      if (!wm) {
        wm = this.hskWords[hskidx] = new Map();
      }
      const we = wm.get(currword.hanzi) ?? {
        word: words[word],
        syls: wsyls,
        count: 0,
      };
      we.count++;
      if (we.count === 1) {
        uniquewordcount++;
        wm.set(currword.hanzi, we);
      }
    }
    this.uniqueWordCount = uniquewordcount;
    this.hskWordCount = hskwordcount;
    this.wordCount = wordcount;
    this.avgHsk = hskwordcount > 0 ? onlyhsktotal / hskwordcount : 0;
    const nonnamecount = wordcount - namecount;
    this.avgHskAll = nonnamecount > 0 ? hsktotal / nonnamecount : 0;
    this.el = null;
  }

  element() {
    if (this.el) {
      return this.el;
    }

    const clipael = document
      .querySelector('#dchelper-audioplayer')
      .cloneNode(true);
    const defaultVolume = Number(
      (configuration.get('audioVolume') ?? '100') / 100
    );
    let active = null;
    async function playclip(pos, length) {
      if (active || !clipael) {
        return;
      }
      active = Math.round(length * 1000) + 75;
      if (!clipael.paused) {
        clipael.pause();
      }
      clipael.currentTime = Math.max(0, pos - 0.02);
      clipael.volume = defaultVolume;
      try {
        await clipael.play();
      } catch (err) {
        active = null;
        console.log('DCHelper: Could not play vocab clip:', err);
      }
    }
    clipael?.addEventListener('playing', _evt => {
      if (!active) {
        clipael.volume = 0.0;
        clipael.pause();
        return;
      }
      setTimeout(() => {
        clipael.volume = 0.0;
        clipael.pause();
        active = null;
      }, active);
    });

    const zityp =
      configuration.get('hanziType') === 'traditional' ? 'tzi' : 'szi';
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 3,
    });
    const el = mkElementTree(
      'div',
      {
        id: 'dchelper-vocab',
        hidden: '',
        class: 'dchvocabcontainer dchtext',
      },
      [
        {typ: 'h3', children: 'Vocabulary (click to dismiss)'},
        {
          typ: 'small',
          children:
            'Note: Unknown words are counted as HSK 10 when averaging for "all".',
        },
        {
          typ: 'div',
          children: `Word count (unique/HSK only/all): ${this.uniqueWordCount} / ${this.hskWordCount} / ${this.wordCount}`,
        },
        {
          typ: 'div',
          children: `Avg. HSK level (HSK only/all): ${formatter.format(
            this.avgHsk
          )} / ${formatter.format(this.avgHskAll)}`,
        },
      ]
    );
    el.firstChild.addEventListener('click', _evt =>
      el.setAttribute('hidden', '')
    );
    function mkCatName(idx) {
      switch (idx) {
        case 10:
          return 'Non-HSK';
        case 11:
          return 'Name';
        default:
          return `HSK ${idx + 1}`;
      }
    }
    this.hskWords.forEach((wm, idx) => {
      const wl = Array.from(wm.entries()).sort(
        (i1, i2) => i2[1].count - i1[1].count
      );
      const lel = mkElementTree('div', null, [
        {typ: 'hr'},
        {typ: 'strong', children: `${mkCatName(idx)} (${wl.length}x):`},
      ]);
      let lastcount = null;
      for (const [_szi, word] of wl) {
        lel.appendChild(
          mkElementTree('span', {class: 'dchother'}, [
            lastcount === word.count
              ? '，'
              : ((lastcount = word.count), ` 【${word.count}x】`),
          ])
        );
        const wel = mkElementTree(
          'span',
          {
            class: 'dchword',
            title: `** ${word.word.pinyin} **\n${word.word.meaning ?? ''}`,
          },
          word.syls.map(syl => {
            return {
              typ: 'span',
              attrs: {class: `dchsyl dchtone${syl.tone ?? 5}`},
              children: syl[zityp],
            };
          })
        );

        const stime = word.syls[0]?.syltime?.start ?? null;
        let etime = 0;
        if (clipael && stime) {
          for (const syl of word.syls) {
            if (syl.syltime?.start) {
              etime = Math.max(etime, syl.syltime?.end ?? clipael.duration);
            }
          }
          wel.addEventListener('click', evt => {
            playclip(stime, etime - stime);
            evt.stopPropagation();
          });
        }
        lel.appendChild(wel);
      }
      el.appendChild(lel);
    });
    this.el = el;
    return el;
  }
}

function CRD(crdtext) {
  const me = this;

  const toneRe = /[\u0304\u0301\u030c\u0300]/u;
  const spaceRe = /[\s'‘]+/;
  const toneMarkChars = ['\u0304', '\u0301', '\u030c', '\u0300'];
  const toneMap = new Map(toneMarkChars.map((tc, idx) => [tc, idx + 1]));

  me.crd = JSON.parse(crdtext);
  unsafeWindow.dc_crd = me.crd;
  me.syls = null;
  me.tracker = null;

  function ensureCRD() {
    if (me.crd === null && me.text !== null) {
      me.crd = JSON.parse(me.text);
      unsafeWindow.dc_crd = me.crd;
      me.text = null;
    }
    if (me.crd !== null && me.syls === null) {
      me.syls = makeSyllables(me.crd);
    }
  }

  ensureCRD();

  function pinyinTones(syllables) {
    return syllables.map(syl => {
      const tmatch = syl.normalize('NFD')?.match(toneRe);
      return tmatch ? toneMap.get(tmatch[0]) : 0;
    });
  }

  function makeSyllables(crd) {
    const syl2imap = [];
    const items = [];
    const encountered = new Set();
    let cidx = 0,
      csize = 0,
      widx = -1,
      sidx = 0,
      iidx = 0;

    for (const word of crd.words) {
      widx++;
      if (widx >= crd.sentence_indices[sidx]) {
        sidx++;
      }
      if (!word.hanzi) {
        continue;
      }
      if (!word.pinyin && word.hanzi.trim().length === 0) {
        if (csize === 0) {
          continue;
        }
        cidx++;
        csize = 0;
        continue;
      }
      if (!word.pinyin || !isNaN(word.pinyin)) {
        const syls = word.pinyin ? Number(word.pinyin) ?? 0 : 0;
        const i = {
          chunk: cidx,
          sentence: sidx,
          word: widx,
          raw: word.hanzi,
        };
        if (syls > 0) {
          i.sy = syl2imap.length;
          if (syls > 1) {
            i.sycount = syls;
          }
        }
        items.push(i);
        for (let i = 0; i < syls; i++) {
          syl2imap.push(iidx);
        }
        iidx++;
        csize++;
        continue;
      }
      const first = !encountered.has(word.hanzi);
      if (first) {
        encountered.add(word.hanzi);
      }
      const psyls = word.pinyin.split(spaceRe);
      if (psyls.length !== word.hanzi.length) {
        console.log('DCH: Unexpected syllable length!', word);
        continue;
      }
      const tones = pinyinTones(psyls);
      tones.forEach((tone, charidx) => {
        const i = {
          chunk: cidx,
          sentence: sidx,
          word: widx,
          sy: syl2imap.length,
          szi: word.hanzi[charidx],
          tzi: word.tc_hanzi[charidx],
          tone: tone,
          phon: psyls[charidx],
          hsk: word.hsk,
        };
        // Note: DC uses "r" for erhua, "er" would be a syllable that is actually spoken. i.e. 婴儿
        const is_erhua = charidx > 0 && i.szi === '儿' && i.phon === 'r';
        if (first) {
          i.firstseen = true;
        }
        if (!is_erhua) {
          i.syltime = {
            start: crd.syllable_times[syl2imap.length - 1] ?? 0.0,
            end: crd.syllable_times[syl2imap.length] ?? null,
          };
          syl2imap.push(iidx);
        } else {
          i.sycount = 0;
        }
        items.push(i);
        iidx++;
        csize++;
      });
    }

    items.forEach((item, idx) => {
      let nitem = items[idx + 1];
      const next_is_erhua = nitem && nitem.szi === '儿' && nitem.phon === 'r';
      if (next_is_erhua && nitem.word === item.word) {
        nitem = items[idx + 2];
      }
      if (
        item.tone === 3 &&
        nitem?.sentence === item.sentence &&
        nitem.tone === 3
      ) {
        item.sandhi = 2;
        return;
      }
      if (item.szi === '一' && item.tone !== 1) {
        item.sandhi = item.tone;
        item.tone = 1;
      } else if (item.szi === '不' && item.tone !== 4) {
        item.sandhi = item.tone;
        item.tone = 4;
      }
    });
    return {s: syl2imap, i: items};
  }

  this.makeElement = function (currEl) {
    ensureCRD();
    const simplified = configuration.get('hanziType') === 'simplified';
    const sandhiHints = configuration.get('sandhiHints') === 'on';
    const toneColorThreshold = configuration.get('hanziToneColorThreshold');
    const annoThreshold = configuration.get('annoThreshold');
    const onlyFirst = configuration.get('hintOnlyFirst');
    let showAnnotations = configuration.get('annoType');
    if (showAnnotations === 'off') {
      showAnnotations = null;
    }
    const annoPos = showAnnotations && configuration.get('annoPosition');
    const annoPosLeft =
      annoPos && (annoPos === 'left' || annoPos === 'left-vertical');

    const el = currEl ?? document.createElement('div');
    el.innerHTML = '';
    el.setAttribute('class', 'dchtext');
    el.setAttribute('id', 'dchelper-storytext');
    const syels = [];
    let lchunk = -1,
      lsentence = -1,
      lword = -1;
    let cel = null,
      sel = null,
      wel = null;
    let transel = null;
    for (const {
      chunk,
      sentence,
      word,
      sy,
      szi,
      tzi,
      tone,
      sandhi,
      phon,
      sycount,
      raw,
      hsk,
      firstseen,
    } of me.syls.i) {
      if (transel === null) {
        const trans = (me.crd.sentence_translations[lsentence] ?? '').trim();
        if (trans.length > 0) {
          transel = mkElementTree(
            'span',
            {class: 'dchpadhint', title: trans},
            ' '
          );
        } else {
          transel = undefined;
        }
      }
      if (chunk !== lchunk) {
        lchunk = chunk;
        cel = mkElementTree(
          'p',
          {class: 'dchchunk'},
          sentence > 0
            ? [{typ: 'span', attrs: {class: 'dchpad'}, children: '  '}]
            : null
        );
        el.appendChild(cel);
        if (sel !== null && transel) {
          sel.appendChild(transel);
        }
        transel = null;
        sel = null;
        wel = null;
      }
      if (!sel || lsentence !== sentence) {
        if (sel !== null && transel) {
          sel.appendChild(transel);
        }
        transel = null;
        lsentence = sentence;
        wel = null;
        sel = document.createElement('span');
        sel.setAttribute('class', 'dchsent');
        if (sentence === 0) {
          sel.setAttribute('id', 'dchsent0');
        }
        cel.appendChild(sel);
      }
      if (!phon) {
        wel = null;
        const oel = mkElementTree('span', {class: 'dchother'}, raw);
        sel.appendChild(oel);
        if (sy) {
          const synum = sycount ?? 1;
          for (let offs = 0; offs < synum; offs++) {
            syels.push([cel, sel, null, oel]);
          }
        }
        const seekpos =
          me.crd.syllable_times[Math.max(0, syels.length - 1)] ?? 0;
        oel.addEventListener('click', _evt => {
          bus.dispatchEvent(new CustomEvent('seek', {detail: seekpos}));
        });
        continue;
      }
      if (!wel || lword !== word) {
        lword = word;
        wel = document.createElement('ruby');
        wel.setAttribute('class', 'dchword');
        const currword = me.crd.words[word] ?? {};
        if (currword.meaning) {
          wel.setAttribute(
            'title',
            `${currword.pinyin}${
              currword.hsk > 0 ? ` (HSK${currword.hsk})` : ''
            }\n${currword.meaning ?? ''}`
          );
        }
        sel.appendChild(wel);
      }

      const useAnno =
        firstseen || (onlyFirst !== 'both' && onlyFirst !== 'annotation');
      const useTC =
        firstseen || (onlyFirst !== 'both' && onlyFirst !== 'tonecolor');
      const yel = document.createElement('span');
      yel.setAttribute('class', 'dchsyl');
      if (
        useTC &&
        (toneColorThreshold === 0 ||
          (hsk ?? 0) === 0 ||
          hsk >= toneColorThreshold)
      ) {
        yel.classList.add(`dchtone${tone > 0 ? tone : 5}`);
      }
      yel.appendChild(document.createTextNode(simplified ? szi : tzi));
      if (sandhi && sandhiHints) {
        yel.classList.add(`dchtonechange${sandhi}`);
      }
      let rel;
      if (
        showAnnotations &&
        useAnno &&
        (annoThreshold === 0 || (hsk ?? 0) === 0 || hsk >= annoThreshold)
      ) {
        let anno;
        switch (showAnnotations) {
          case 'pinyin':
            anno = phon ?? '';
            break;
          case 'zhuyin':
            anno = PinyinConverter.convert_zhuyin(phon) ?? '(??Z)';
            break;
          case 'ipa':
            anno = PinyinConverter.convert_ipa(phon) ?? '(??I)';
            break;
          case 'tonemark':
            anno =
              tone > 0 && tone < 5 ? `${toneMarkChars[tone - 1]}\u00A0` : '';
            break;
          case 'tonenumber':
            anno = tone > 0 ? tone.toString() : '';
            break;
          case 'hsklevel':
            anno = hsk > 0 ? hsk.toString() : '+';
            break;
          case 'traditionalzi':
            anno = tzi?.concat('\u200B') ?? '';
            break;
          case 'simplifiedzi':
            anno = szi?.concat('\u200B') ?? '';
            break;
          case 'otherzi':
            anno = (tzi !== szi ? (simplified ? tzi : szi) : '') ?? '';
            break;
          default:
            anno = '';
        }
        if (anno?.length > 0) {
          rel = mkElementTree('rt', {class: `dchsyl dchtone${tone}`}, anno);
        } else {
          rel = document.createElement('rt'); // Necessary to keep annotations aligned.
        }
      }
      if (rel && annoPosLeft) {
        wel.appendChild(rel);
        rel = null;
      }
      wel.appendChild(yel);
      if (rel) {
        wel.appendChild(rel);
      }
      const seekpos = me.crd.syllable_times[Math.max(0, syels.length - 1)] ?? 0;
      yel.addEventListener('click', _evt => {
        bus.dispatchEvent(new CustomEvent('seek', {detail: seekpos}));
      });
      if (sycount !== 0) {
        syels.push([cel, sel, wel, yel]);
      }
    }
    if (sel !== null && transel) {
      sel.appendChild(transel);
      transel = null;
    }
    me.tracker = new TrackPlayback(syels, me.crd.syllable_times);
    return el;
  };
}

function DCHelper(name, audio, crd) {
  const me = this;

  this.name = name;
  this.audio = audio;
  this.crd = new CRD(crd);
  this.vocab = new Vocabulary(this.crd.syls, this.crd.crd.words);

  const docChunk = mkElementTree('div', {
    class: 'dchcontainer',
    id: 'dchelper-container',
  });

  let tid = null;

  me.reset = function () {
    if (tid !== null) {
      clearInterval(tid);
      tid = null;
    }
    me.audio = null;
    if (me.crd) {
      me.crd = null;
    }
    me.vocab = null;
    me.name = null;
    const e = document.getElementById('dchelper-container');
    if (e) {
      e.remove();
    }
  };

  function addChunk() {
    if (me.crd === null) {
      return false;
    }
    if (document.getElementById('dchelper-container')) {
      return true;
    }
    const container = document.querySelector('div.lesson-content-container');
    if (!container) {
      console.log('DCHelper: No lesson container!');
      return false;
    }
    container.before(docChunk);
    return true;
  }

  function updateChunk() {
    if (!addChunk()) {
      return false;
    }
    docChunk.innerHTML = '';
    const addSep = () =>
      docChunk.appendChild(document.createTextNode(' \u00A0 '));

    let ael = null;
    if (me.audio.src) {
      ael = mkElementTree('audio', {id: 'dchelper-audioplayer', controls: ''}, [
        {typ: 'source', attrs: {src: me.audio.src, type: me.audio.type}},
      ]);
      ael.volume = Number((configuration.get('audioVolume') ?? '100') / 100);
      ael.playbackRate = Number(
        (configuration.get('audioSpeed') ?? '100') / 100
      );
      const efseek = evt => {
        if (me.crd === null) {
          bus.removeEventListener('seek', efseek);
          return;
        }
        ael.currentTime = evt.detail;
      };
      const efapos = evt => {
        if (me.crd === null) {
          bus.removeEventListener('audioposition', efseek);
          return;
        }
        me.crd?.tracker?.update(evt.detail);
      };
      bus.addEventListener('seek', efseek);
      bus.addEventListener('audioposition', efapos);
      {
        let prevtime = null;
        ael.addEventListener('play', _evt => {
          if (tid !== null) {
            clearInterval(tid);
          }
          tid = setInterval(() => {
            if (ael.paused) {
              clearInterval(tid);
              tid = null;
              prevtime = null;
              bus.dispatchEvent(
                new CustomEvent('audioposition', {detail: null})
              );
              return;
            }
            if (ael.currentTime !== prevtime) {
              prevtime = ael.currentTime;
              bus.dispatchEvent(
                new CustomEvent('audioposition', {detail: prevtime})
              );
            }
          }, 100);
        });
      }
    }

    if (ael !== null) {
      docChunk.appendChild(ael);
      addSep();
    }

    {
      const el = mkElementTree(
        'a',
        {href: '#0', title: 'Toggle configuration display'},
        '⚙️'
      );
      el.addEventListener('click', _evt => {
        document.getElementById('dchelper-config')?.toggleAttribute('hidden');
        return false;
      });
      docChunk.appendChild(el);
    }
    {
      addSep();
      const el = mkElementTree(
        'a',
        {href: '#0', title: 'Toggle story visibility'},
        '👀'
      );
      el.addEventListener('click', _evt => {
        document
          .getElementById('dchelper-storytext')
          ?.toggleAttribute('hidden');
        return false;
      });
      docChunk.appendChild(el);
    }

    {
      addSep();
      const el = mkElementTree(
        'a',
        {href: '#0', title: 'Copy lesson text to clipboard'},
        '💬'
      );
      el.addEventListener('click', _evt => {
        const txt =
          document.getElementById('lesson-canvas')?.textContent ?? null;
        if (!txt) {
          alert('DCHelper: Could not get text. It may not have loaded yet.');
        } else {
          GM_setClipboard(txt);
        }
        return false;
      });
      docChunk.appendChild(el);
    }

    {
      addSep();
      const el = mkElementTree(
        'a',
        {href: '#0', title: 'Toggle vocabulary visibility'},
        '📚'
      );
      el.addEventListener('click', _evt => {
        document.getElementById('dchelper-vocab')?.toggleAttribute('hidden');
        return false;
      });
      docChunk.appendChild(el);
    }

    if (me.crd !== null) {
      docChunk.appendChild(document.createElement('hr'));
      bus.dispatchEvent(
        new CustomEvent('configupdate', {detail: configuration})
      );
      let el = me.crd.makeElement();
      const ef = _evt => {
        if (me.crd === null) {
          bus.removeEventListener('configupdate', ef);
          return;
        }
        el = me.crd.makeElement(el);
      };
      bus.addEventListener('configupdate', ef);
      docChunk.appendChild(el);
    }
    document
      .getElementById('dchelper-storytext')
      ?.before(configuration.element);
    configuration.element.after(me.vocab.element());
    return true;
  }
  me.element = docChunk;

  updateChunk();
  me.update = updateChunk;
}

function initUserScript() {
  if (
    typeof window === 'undefined' ||
    window.location?.host?.toLowerCase() !== 'duchinese.net'
  ) {
    return false;
  }
  if (GM_getValue('acceptedterms') !== true) {
    const result = prompt(`
      *** DC Helper ***\n\n

      This userscript may cause the site to break in various ways, including but not limited to performance or display problems.\n
      This is an unsupported third party modification and may stop working at any time, or interfere with normal usage of the site.\n\n
      If you experience ANY issues make sure you disable this script and completely restart your browser then verify the issue persists BEFORE even considering it could be a problem with the site.\n\n
      If you accept the risks and conditions, enter "i agree". (Note that the page will reload.)
    `)
      ?.trim()
      .toLowerCase();
    if (result !== 'i agree') {
      return;
    }
    GM_setValue('acceptedterms', true);
    location.reload();
  }

  bus.addEventListener('configupdate', evt => applyStyles(evt.detail.cfg));
  configuration = new Config();
  const docstate = new DCDocState(new DCHState());

  const matchCRD =
    /^https?:\/\/static\.duchinese\.net\/[^?]+?\/[0-9a-f]+\.crd\?.*/i;
  const orig_open = unsafeWindow.XMLHttpRequest.prototype.open,
    orig_send = unsafeWindow.XMLHttpRequest.prototype.send;

  const interceptOpen = function (method, url, _async, _user, _password) {
    if (method?.toUpperCase() === 'GET' && matchCRD.test(url ?? '')) {
      this.__dch_intercept = true;
    }
    return orig_open.apply(this, arguments);
  };

  const onloadHook = function () {
    console.log('XHR:LOAD', this.status);
    if (
      this.__dch_intercept &&
      this.status === 200 &&
      this.responseText?.length > 0
    ) {
      const rt = this.responseText;
      // console.log('XHR:LOAD', this.status, rt);
      setTimeout(() => docstate.updateCRD(rt), 0);
    }
    if (this._onload) {
      return this._onload.apply(this, arguments);
    }
  };

  const interceptSend = function (_data) {
    if (this.__dch_intercept) {
      if (this.onload) {
        this._onload = this.onload;
      }
      this.onload = onloadHook;
    }
    return orig_send.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.open = interceptOpen;
  window.XMLHttpRequest.prototype.send = interceptSend;
  unsafeWindow.XMLHttpRequest.prototype.open = interceptOpen;
  unsafeWindow.XMLHttpRequest.prototype.send = interceptSend;
  return true;
}

// EXPORTS
// exports.initUserScript = initUserScript;
// exports.Config = Config;
// exports.defaultConfig = defaultConfig;
export {initUserScript};
