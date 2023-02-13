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
  [key: string]: string | number | boolean | undefined;
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

interface ConfigStore {
  get(): ConfigKVs | undefined;
  set(_cfg: ConfigKVs): void;
  clear(): void;
}

type GMGetter = (
  _name: string
) =>
  | {[key: string]: string | number | boolean | object | null | undefined}
  | undefined;
type GMSetter = (_name: string, _val: ConfigKVs) => void;
type GMDeleter = (_name: string) => void;
class UserscriptConfigStore implements ConfigStore {
  getter: GMGetter;
  setter: GMSetter;
  deleter: GMDeleter;
  constructor(get: GMGetter, set: GMSetter, del: GMDeleter) {
    this.getter = get;
    this.setter = set;
    this.deleter = del;
  }
  get(): ConfigKVs | undefined {
    return this.getter('config') as ConfigKVs;
  }
  set(cfg: ConfigKVs): void {
    this.setter('config', cfg);
  }
  clear(): void {
    this.deleter('config');
  }
}

class Config {
  cfg: ConfigKVs;
  private bus: EventTarget;
  private store: ConfigStore;
  element: HTMLElement;
  constructor(bus: EventTarget, store: ConfigStore, cfg?: ConfigKVs) {
    cfg = cfg ?? store.get() ?? defaultConfig;
    for (const [k, v] of Object.entries(defaultConfig)) {
      if (
        v === undefined ||
        configOptions[k]?.options.findIndex(i => i === v) < 0
      ) {
        cfg[k] = defaultConfig[k];
      }
    }
    this.cfg = cfg;
    this.bus = bus;
    this.store = store;
    this.element = this.initElement();
  }

  get<T extends string>(key: T): ConfigKVs[T] {
    return this.cfg[key];
  }

  makeOption(name: string, option: ConfigOption) {
    const el = document.createElement('label');
    const sel = document.createElement('select');
    sel.setAttribute('name', name);
    const bus = this.bus;
    sel.addEventListener('change', evt => {
      if (!evt.target || !('value' in evt.target)) {
        return;
      }
      this.cfg[name] = JSON.parse(evt.target.value as string);
      bus.dispatchEvent(new CustomEvent('configupdate', {detail: this}));
    });
    el.appendChild(document.createTextNode(`${option.name ?? name}: `));
    el.setAttribute('class', 'dchoptlabel');
    for (const optval of option.options) {
      const oel = document.createElement('option');
      oel.setAttribute('value', JSON.stringify(optval));
      const currval = this.cfg[name] ?? null;
      if (currval === optval) {
        oel.setAttribute('selected', '');
      }
      oel.appendChild(document.createTextNode(`${optval}`));
      sel.appendChild(oel);
    }
    el.appendChild(sel);
    return el;
  }

  initElement(): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('id', 'dchelper-config');
    el.setAttribute('hidden', '');
    for (const [ok, ov] of Object.entries(configOptions)) {
      el.appendChild(this.makeOption(ok, ov));
    }
    const pel = document.createElement('p');
    {
      const lel = document.createElement('a');
      lel.setAttribute('href', '#0');
      lel.appendChild(document.createTextNode('[Save]'));
      lel.addEventListener('click', _evt => {
        this.store.set(this.cfg);
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
        this.store.clear();
        return false;
      });
      pel.appendChild(lel);
    }
    el.appendChild(pel);
    return el;
  }
}

export {
  themes,
  ConfigKVs,
  ConfigOption,
  configOptions,
  defaultConfig,
  Config,
  ConfigStore,
  UserscriptConfigStore,
};
