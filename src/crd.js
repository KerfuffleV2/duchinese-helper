import {mkElementTree} from './util.ts';
import {configuration, bus} from './globals.ts';
import {PinyinConverter} from './pinyin_converter.ts';
import {TrackPlayback} from './trackplayback.js';

function CRD(crdtext) {
  const me = this;

  const toneRe = /[\u0304\u0301\u030c\u0300]/u;
  const spaceRe = /[\s'‘]+/;
  const toneMarkChars = ['\u0304', '\u0301', '\u030c', '\u0300'];
  const toneMap = new Map(toneMarkChars.map((tc, idx) => [tc, idx + 1]));
  // ，、。：；“‘
  const punctFixup = new Map([
    ['，', ', '],
    ['、', ', '],
    ['。', '. '],
    ['：', ': '],
    ['；', '; '],
    ['“', '"'],
    ['‘', "'"],
  ]);

  me.crd = JSON.parse(crdtext);
  if (unsafeWindow) {
    unsafeWindow.dc_crd = me.crd;
  }
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

    const transdiv = mkElementTree(
        'div',
        {
          id: 'dchelper-translationtext',
          hidden: '',
        },
        [{typ: 'h3', children: 'Translation'}]
      ),
      pindiv = mkElementTree(
        'div',
        {
          id: 'dchelper-pinyintext',
          hidden: '',
        },
        [{typ: 'h3', children: 'Pinyin'}]
      );
    let pinchunk = mkElementTree('p', {class: 'dchchunk'}),
      transchunk = mkElementTree('p', {class: 'dchchunk'}),
      plastword = false;
    transdiv.appendChild(transchunk);
    pindiv.appendChild(pinchunk);
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
          transchunk.appendChild(document.createTextNode(` ${trans}`));
          transel = mkElementTree(
            'span',
            {class: 'dchpadhint', title: trans},
            '   '
          );
        } else {
          transel = undefined;
        }
      }
      if (chunk !== lchunk) {
        plastword = false;
        pinchunk = mkElementTree('p', {class: 'dchchunk'});
        transchunk = mkElementTree('p', {class: 'dchchunk'});
        transdiv.appendChild(transchunk);
        pindiv.appendChild(pinchunk);
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
        plastword = false;
        pinchunk.appendChild(
          document.createTextNode(punctFixup.get(raw) ?? raw)
        );
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
          if (plastword) {
            pinchunk.appendChild(document.createTextNode(' '));
          }
          pinchunk.appendChild(
            document.createTextNode(currword.pinyin?.replaceAll(' ', '') ?? '')
          );
          plastword = true;
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
    el.appendChild(pindiv);
    el.appendChild(transdiv);
    return el;
  };
}

export {CRD};
