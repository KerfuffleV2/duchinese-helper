interface ConfigKVs {
  theme: string;
  hanziType: string;
  hanziToneColors: string;
  hanziToneColorThreshold: number;
  sandhiHints: string;
  annoType: string;
  annoPosition: string;
  annoThreshold: number;
  hintOnlyFirst: string;
  hintOnlyHover: string;
  audioVolume: number;
  audioLoop: false;
  audioSpeed: number;
  fontSize: string;
  fontWeight: number;
  fontFamilySimplified: string;
  fontFamilyTraditional: string;
  vocabHskThreshold: number;
}

interface ConfigOption {
  name: string;
  options: Array<string | number>;
}

interface Theme {
  backgroundColor: string;
  border: string;
  textColor: string;
  activeSyllable: string;
  activeWord: string;
  activeSentence: string;
  hoverWord: string;
  hoverSentence: string;
  hoverSentenceHint: string;
  toneThemes?: {
    [key: string]: {
      tones: [string, string, string, string, string, string];
      toneChange?: {[key: number]: string};
    };
  };
}

type FamilyType = 'local' | 'google';

class FontFamily {
  name: string;
  typ: FamilyType;
  simplified: boolean;
  traditional: boolean;
  constructor(
    name: string,
    typ: FamilyType = 'local',
    simplified: boolean,
    traditional: boolean
  ) {
    this.name = name;
    this.typ = typ ?? 'local';
    this.simplified = simplified ?? false;
    this.traditional = traditional ?? false;
  }
}

const defaultConfig: ConfigKVs = {
  theme: 'dark',
  hanziType: 'simplified',
  hanziToneColors: 'vivid',
  hanziToneColorThreshold: 0,
  sandhiHints: 'on',
  annoType: 'off',
  annoPosition: 'over',
  annoThreshold: 0,
  hintOnlyFirst: 'off',
  hintOnlyHover: 'off',
  audioVolume: 50,
  audioLoop: false,
  audioSpeed: 100,
  fontSize: '20pt',
  fontWeight: 400,
  fontFamilySimplified: 'local:serif',
  fontFamilyTraditional: 'local:serif',
  vocabHskThreshold: 1,
};

const fontFamilies = [
  new FontFamily('default', 'local', true, true),
  new FontFamily('sans-serif', 'local', true, true),
  new FontFamily('serif', 'local', true, true),
  new FontFamily('AR PL UMing CN', 'local', true, true),
  new FontFamily('AR PL UKai CN', 'local', true, true),
  new FontFamily('Noto Sans SC', 'google', true, false),
  new FontFamily('Noto Serif SC', 'google', true, false),
  new FontFamily('Noto Sans TC', 'google', false, true),
  new FontFamily('Noto Serif TC', 'google', false, true),
  new FontFamily('ZCOOL XiaoWei', 'google', true, false),
  new FontFamily('ZCOOL QingKe HuangYou', 'google', true, true),
  new FontFamily('Ma Shan Zheng', 'google', true, false),
  new FontFamily('ZCOOL KuaiLe', 'google', true, false),
  new FontFamily('Zhi Mang Xing', 'google', true, false),
];

const themes: {[key: string]: Theme} = {
  dark: {
    backgroundColor: '#001b26',
    border: '3px inset #204b56',
    textColor: '#bbb',
    activeSyllable: 'background-color: rgba(100,150,150,0.4);',
    activeWord: 'background-color: rgba(100,150,150,0.3);',
    activeSentence: 'background-color: rgba(100,150,150,0.1);',
    hoverWord: 'background-color: rgba(100,100,80,0.15);',
    hoverSentence: 'background-color: rgba(100,100,80,0.15);',
    hoverSentenceHint: 'box-shadow: 0px 3px 3px rgba(100,100,150,0.8);',
    toneThemes: {
      vivid: {
        tones: [
          '#eee',
          'crimson',
          'orange',
          'limegreen',
          'cornflowerblue',
          'grey',
        ], // 0 used for punctuation/items with no pinyin
        toneChange: {
          2: 'border-bottom: .5px double orange; border-radius: 30% 10%;',
          4: 'border-bottom: .5px double deepskyblue; border-radius: 10% 30%;',
        },
      },
      pastel: {
        tones: ['#ddd', '#cfa0a0', '#cfcfa0', '#a0cfa0', '#a0a0cf', '#9a9a9a'], // 0 used for punctuation/items with no pinyin
        toneChange: {
          2: 'border-bottom: 1px solid #e0c070; border-radius: 30% 10%;',
          4: 'border-bottom: 1px solid #8080e0; border-radius: 10% 30%;',
        },
      },
    },
  },

  light: {
    backgroundColor: '#f9f9f9',
    border: '2px inset #a0d0d0',
    textColor: 'inherit',
    activeSyllable: 'background-color: rgba(150,150,150,0.4);',
    activeWord: 'background-color: rgba(150,150,150,0.3);',
    activeSentence: 'background-color: rgba(150,150,150,0.2);',
    hoverWord: 'background-color: rgba(100,100,80,0.35);',
    hoverSentence: 'background-color: rgba(100,100,100,0.20);',
    hoverSentenceHint: 'box-shadow: 0px 3px 3px rgba(100,100,150,0.8);',
    toneThemes: {
      vivid: {
        tones: ['inherit', '#a01010', '#a09010', '#109010', '#1010a0', 'gray'], // 0 used for punctuation/items with no pinyin
        toneChange: {
          2: 'border-bottom: 2px solid #f0e070; border-radius: 30% 10%;',
          4: 'border-bottom: 2px solid #8080f0; border-radius: 10% 30%;',
        },
      },
      pastel: {
        tones: ['inherit', '#601010', '#606010', '#106010', '#101040', 'gray'], // 0 used for punctuation/items with no pinyin
        toneChange: {
          2: 'border-bottom: 2px solid #e0c070; border-radius: 30% 10%;',
          4: 'border-bottom: 2px solid #8080e0; border-radius: 10% 30%;',
        },
      },
    },
  },
};

const configOptions: {[key: string]: ConfigOption} = {
  theme: {name: 'Theme', options: ['dark', 'light']},
  hanziType: {name: 'Characters', options: ['simplified', 'traditional']},
  hanziToneColors: {name: 'Tone colors', options: ['off', 'vivid', 'pastel']},
  hanziToneColorThreshold: {
    name: 'Tone color HSK level threshold',
    options: Array.from({length: 10}, (_, idx) => idx),
  },
  sandhiHints: {name: 'Tone sandhi hints', options: ['off', 'on']},
  annoType: {
    name: 'Annotation type',
    options: [
      'off',
      'pinyin',
      'zhuyin',
      'ipa',
      'tonemark',
      'tonenumber',
      'hsklevel',
      'otherzi',
      'traditionalzi',
      'simplifiedzi',
    ],
  },
  annoPosition: {
    name: 'Annotation position',
    options: [
      'over',
      'under',
      'left',
      'right',
      'left-vertical',
      'right-vertical',
    ],
  },
  annoThreshold: {
    name: 'Annotation HSK level threshold',
    options: Array.from({length: 10}, (_, idx) => idx),
  },
  hintOnlyFirst: {
    name: 'Only show annotation or tone color once per word',
    options: ['off', 'both', 'annotation', 'tonecolor'],
  },
  hintOnlyHover: {
    name: 'Only show annotation or tone color when hovered',
    options: ['off', 'both', 'annotation', 'tonecolor'],
  },
  audioVolume: {
    name: 'Initial volume',
    options: Array.from({length: 11}, (_, idx) => 10 * idx),
  }, // 0, 5, ... 100
  audioSpeed: {
    name: 'Initial play rate',
    options: Array.from({length: 20}, (_, idx) => 10 + 10 * idx),
  }, // 10, 20, ... 300
  fontSize: {
    name: 'Font size',
    options: Array.from({length: 23}, (_, idx) => `${8 + idx}pt`),
  }, // 8pt, 9pt, ... 30pt
  fontWeight: {
    name: 'Font weight',
    options: Array.from({length: 10}, (_, idx) => 100 + 100 * idx),
  }, // 100, 200, ...
  fontFamilySimplified: {
    name: 'Font (simplified)',
    options: fontFamilies
      .filter(x => x.simplified === true)
      .map(x => `${x.typ}:${x.name}`),
  },
  fontFamilyTraditional: {
    name: 'Font (traditional)',
    options: fontFamilies
      .filter(x => x.traditional === true)
      .map(x => `${x.typ}:${x.name}`),
  },
  vocabHskThreshold: {
    name: 'Vocabulary HSK threshold',
    options: Array.from({length: 7}, (_, idx) => idx + 1),
  },
};

function applyStyles(cfg: ConfigKVs) {
  let sel = document.getElementById('dchelper-styles');
  if (sel) {
    sel.remove();
  } else {
    sel = document.createElement('style');
    sel.setAttribute('id', 'dchelper-styles');
  }

  const theme = themes[cfg.theme ?? 'dark'] ?? themes['dark'];
  const tonetheme = theme?.toneThemes?.[cfg.hanziToneColors];
  const origfontfamily =
    cfg[
      cfg.hanziType === 'simplified'
        ? 'fontFamilySimplified'
        : 'fontFamilyTraditional'
    ];
  const fontfamily = origfontfamily.split(':')[1];
  const annoOnlyHover = ['annotation', 'both'].includes(cfg.hintOnlyHover);
  const tcOnlyHover = ['tonecolor', 'both'].includes(cfg.hintOnlyHover);
  const tonestyles =
    tonetheme?.tones
      ?.map(
        (v, idx) =>
          `${
            tcOnlyHover
              ? `.dchchunk:hover .dchtone${idx} , #dchelper-vocab `
              : ''
          }.dchtone${idx} { color: ${v}; }`
      )
      .join('\n') ?? '';
  const tonechangestyles = Object.entries(tonetheme?.toneChange ?? {})
    .map(([k, v]) => `.dchtonechange${k} { ${v} }`)
    .join('\n');
  const annoNormal =
    cfg.annoPosition === 'over' || cfg.annoPosition === 'under';
  const annoVertical =
    cfg.annoPosition === 'left-vertical' ||
    cfg.annoPosition === 'right-vertical';

  if (origfontfamily.startsWith('google:')) {
    document.getElementById('dchelper-rstyles')?.remove();
    const el = document.createElement('link');
    el.setAttribute('id', 'dchelper-rstyles');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute(
      'href',
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        fontfamily
      )}`
    );
    document.head?.appendChild(el);
  }

  const style = `
    .dchcontainer {
      width: 100%;
      font-size: 1.5em;
      background-color: ${theme.backgroundColor};
      border-radius: .5em;
      border: ${theme.border};
      padding: 1em;
    }

    .dchtext {
      font-size: ${cfg.fontSize};
      ${fontfamily !== 'default' ? `font-family: "${fontfamily}";` : ''}
      font-weight: ${cfg.fontWeight};
      padding-bottom: 1em;
      padding-top: .5em;
      color: ${theme.textColor};
      text-rendering: optimizeLegibility;
    }

    #dchelper-config {
      font-size: 1em;
      font-family: sans-serif;
    }

    label.dchoptlabel {
      font-size: 16pt;
      line-height: 17pt;
      font-weight: 600;
      color: ${theme.textColor};
      display: block;
    }
    .dchoptlabel select {
      color: #ccc;
      background-color: #101a1a;
      font-size: 14pt;
      line-height: 15pt;
    }

    #dchelper-audioplayer { height: 1em; }

    #dchelper-vocab {
      border-radius: .25em;
      border: ${theme.border};
      padding-left: 1em;
      padding-right: 1em;
      margin-top: .5em;
      padding-top: 0;
    }

    ruby.dchword {
      ${annoNormal ? `ruby-position: ${cfg.annoPosition};` : ''}
      ruby-align: center;
    }

    ruby.dchword rt {
      white-space: pre-wrap;
      font-weight: 400;
      font-family: monospace;
      padding-left: 2pt;
      padding-right: 2pt;
      ${annoOnlyHover ? 'visibility: collapse;' : ''}
    }
    ${annoOnlyHover ? '.dchchunk:hover rt { visibility: visible; }' : ''}

    .dchpad, .dchpadhint { white-space: pre-wrap; }

    .dchactivesyl { ${theme.activeSyllable} }

    .dchactiveword { ${theme.activeWord} }

    .dchactivesent { ${theme.activeSentence} }

    .dchchunk {
      margin: 0;
      padding: 0;
      margin-bottom: .2em;
      line-height: calc(${cfg.fontSize} + 4pt);
    }
    #dchsent0 { font-size: 135%; }
    .dchsent:hover { ${theme.hoverSentence} }
    .dchword:hover { ${theme.hoverWord} }
    .dchsent:hover span.dchpadhint { ${theme.hoverSentenceHint} }
    .dchsyl, .dchword, .dchsent {
      transition: all 0.25s ease;
      border-radius: .15em;
    }
    rt.dchsyl {
      ${
        annoVertical
          ? 'writing-mode: vertical-rl; text-orientation: upright;'
          : ''
      }
      ${annoNormal ? '' : 'display: inline;'}
    }
    ${tonestyles}
    ${tonechangestyles}
  `;

  sel.textContent = style;
  document.head?.append(sel);
}

export {applyStyles, ConfigKVs, ConfigOption, configOptions, defaultConfig};
