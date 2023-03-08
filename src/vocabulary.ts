import {PinyinConverter} from './pinyin_converter';
import {Config} from './config';
import {mkElementTree} from './util';

interface CRDWord {
  hsk?: number;
  meaning?: string;
  hanzi: string;
  tc_hanzi?: string;
  pinyin?: string;
}

interface CRDSyllable {
  chunk: number;
  sentence: number;
  word: number;
  raw: string;
  sy: number;
  szi: string;
  tzi: string;
  phon: string;
  hsk: number;
  tone: number;
  firstseen?: boolean;
  syltime?: {start: number; end: number};
}

interface VocabWord {
  word: CRDWord;
  syls: CRDSyllable[];
  count: number;
}

type VocabWordMap = Map<string, VocabWord>;

class Vocabulary {
  hskWords: Array<VocabWordMap>;
  uniqueWordCount: number;
  hskWordCount: number;
  wordCount: number;
  avgHsk: number;
  avgHskAll: number;
  el: HTMLElement | null;

  constructor(slist: CRDSyllable[], words: CRDWord[]) {
    this.hskWords = new Array(12);
    const slen = slist.length;
    let uniquewordcount = 0,
      wordcount = 0,
      hskwordcount = 0,
      namecount = 0;
    let hsktotal = 0,
      onlyhsktotal = 0;
    for (let idx = 0; idx < slen; ) {
      const {word, phon, hsk} = slist[idx];
      const wsyls = [];
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

  element(configuration: Config) {
    if (this.el) {
      return this.el;
    }

    const clipael: HTMLMediaElement | undefined = document
      ?.querySelector('#dchelper-audioplayer')
      ?.cloneNode(true) as HTMLMediaElement | undefined;
    if (!clipael) {
      return null;
    }
    const defaultVolume = Number(
      (configuration.get('audioVolume') ?? 100) / 100
    );
    let active: null | number = null;
    async function playclip(pos: number, length: number) {
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
    el.firstChild?.addEventListener('click', () =>
      el.setAttribute('hidden', '')
    );
    function mkCatName(idx: number): string {
      switch (idx) {
        case 10:
          return 'Non-HSK';
        case 11:
          return 'Name';
        default:
          return `HSK ${idx + 1}`;
      }
    }
    const vocabThreshold = (configuration.get('vocabHskThreshold') ?? 1) - 1;
    const verbose = configuration.get('vocabVerbose') ?? false;

    function buildBrief(wm: VocabWordMap, idx: number) {
      if (idx < vocabThreshold) {
        return;
      }
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
    }

    function buildVerbose(tel: HTMLElement, wm: VocabWordMap, idx: number) {
      if (idx < vocabThreshold) {
        return;
      }
      const wl = Array.from(wm.entries()).sort(
        (i1, i2) => i2[1].count - i1[1].count
      );
      const catname = mkCatName(idx);
      tel.appendChild(
        mkElementTree('tr', null, [
          {
            typ: 'th',
            children: catname,
          },
          {
            typ: 'th',
            attrs: {colspan: '4'},
            children: `${wl.length} (total)`,
          },
        ])
      );

      for (const [_szi, word] of wl) {
        const pinyin = word.word.pinyin ?? '',
          meaning = word.word.meaning ?? '';

        const rel = mkElementTree('tr', null, [
          {
            typ: 'td',
            children: catname,
          },
          {
            typ: 'td',
            children: word.count.toString(),
          },
          {
            typ: 'td',
            children: word.syls.map(syl => {
              return {
                typ: 'span',
                attrs: {class: `dchsyl dchtone${syl.tone ?? 5}`},
                children: syl[zityp],
              };
            }),
          },
          {
            typ: 'td',
            children: pinyin,
          },
          {
            typ: 'td',
            attrs: {class: 'dch-vocabdef'},
            children: meaning?.replaceAll('\n', ' ❙ '),
          },
        ]);

        const stime = word.syls[0]?.syltime?.start ?? null;
        let etime = 0;
        if (clipael && stime) {
          for (const syl of word.syls) {
            if (syl.syltime?.start) {
              etime = Math.max(etime, syl.syltime?.end ?? clipael.duration);
            }
          }
          rel.addEventListener('click', evt => {
            playclip(stime, etime - stime);
            evt.stopPropagation();
          });
        }

        tel.appendChild(rel);
      }
    }

    if (verbose) {
      const tel = mkElementTree('table', null, [
        {
          typ: 'thead',
          children: [
            {
              typ: 'th',
              children: 'Type',
            },
            {
              typ: 'th',
              children: '#',
            },
            {
              typ: 'th',
              children: '字',
            },
            {
              typ: 'th',
              children: '拼音',
            },
            {
              typ: 'th',
              children: 'Meaning',
            },
          ],
        },
      ]);
      const tbody = document.createElement('tbody');
      tel.appendChild(tbody);
      this.hskWords.forEach((wm, idx) => buildVerbose(tbody, wm, idx));
      el.appendChild(tel);
    } else {
      this.hskWords.forEach(buildBrief);
    }

    this.el = el;
    return el;
  }
}

export {Vocabulary};
