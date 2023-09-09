const unicodeToneRe = /[\u0304\u0301\u030c\u0300]/gu;

const pinyin_initial = [
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'z',
  'c',
  's',
  'zh',
  'ch',
  'sh',
  'r',
  'j',
  'q',
  'x',
  'g',
  'k',
  'h',
];

const zhuyin_initial = [
  'ㄅ',
  'ㄆ',
  'ㄇ',
  'ㄈ',
  'ㄉ',
  'ㄊ',
  'ㄋ',
  'ㄌ',
  'ㄗ',
  'ㄘ',
  'ㄙ',
  'ㄓ',
  'ㄔ',
  'ㄕ',
  'ㄖ',
  'ㄐ',
  'ㄑ',
  'ㄒ',
  'ㄍ',
  'ㄎ',
  'ㄏ',
];

const ipa_initial = [
  'p',
  'pʰ',
  'm',
  'f',
  't',
  'tʰ',
  'n',
  'l',
  'ts',
  'tsʰ',
  's',
  'tʂ',
  'tʂʰ',
  'ʂ',
  'ʐ',
  'tɕ',
  'tɕʰ',
  'ɕ',
  'k',
  'kʰ',
  'x',
];

const pinyin_final = [
  'a',
  'ai',
  'ao',
  'an',
  'ang',
  'e',
  'ei',
  'en',
  'eng',
  'er',
  'o',
  'ou',
  'ong',
  'i',
  'i',
  'ia',
  'iao',
  'ie',
  'iu',
  'ian',
  'iang',
  'in',
  'ing',
  'iong',
  'u',
  'ua',
  'uai',
  'ui',
  'uo',
  'uan',
  'uang',
  'un',
  'eng',
  'v',
  've',
  'van',
  'vn',
];

const pinyin_no_initial = [
  'a',
  'ai',
  'ao',
  'an',
  'ang',
  'e',
  'ei',
  'en',
  'eng',
  'er',
  'o',
  'ou',
  'ong',
  'yi',
  '',
  'ya',
  'yao',
  'ye',
  'you',
  'yan',
  'yang',
  'yin',
  'ying',
  'yong',
  'wu',
  'wa',
  'wai',
  'wei',
  'wo',
  'wan',
  'wang',
  'wen',
  'weng',
  'yu',
  'yue',
  'yuan',
  'yun',
];

const zhuyin_final = [
  'ㄚ', // a
  'ㄞ', // ai
  'ㄠ', // ao
  'ㄢ', // an
  'ㄤ', // ang
  'ㄜ', // e
  'ㄟ', // ei
  'ㄣ', // en
  'ㄥ', // eng
  'ㄦ', // er
  'ㄛ', // o
  'ㄡ', // ou
  'ㄨㄥ', // ong
  'ㄧ', // i
  '', // i(r)
  'ㄧㄚ', // ya
  'ㄧㄠ', // yao
  'ㄧㄝ', // ye
  'ㄧㄡ', // you
  'ㄧㄢ', // yan
  'ㄧㄤ', // yang
  'ㄧㄣ', // yin
  'ㄧㄥ', // ying
  'ㄩㄥ', // yong
  'ㄨ', // wu
  'ㄨㄚ', // wa
  'ㄨㄞ', // wai
  'ㄨㄟ', // wei
  'ㄨㄛ', // wo
  'ㄨㄢ', // wan
  'ㄨㄤ', // wang
  'ㄨㄣ', // wen
  'ㄨㄥ', // weng
  'ㄩ', // yu
  'ㄩㄝ', // yue
  'ㄩㄢ', // yuan
  'ㄩㄣ', // yun
];

const ipa_final = [
  'ɑ', // a
  'aɪ̯', // ai
  'ɑʊ̯', // ao
  'an', // an
  'ɑŋ', // ang
  'ɯ̯ʌ', // e
  'eɪ̯', // ei
  'ən', // en
  'əŋ', // eng
  'ɑɻ', // er
  'ɔ', // o
  'ɤʊ̯', // ou
  'ʊŋ', // ong
  'i', // i
  'ɿ', // i(r)
  'i̯ɑ', // ya
  'i̯ɑʊ̯', // yao
  'iɛ', // ye
  'i̯ɤʊ̯', // you
  'iɛn', // yan
  'i̯ɑŋ', // yang
  'in', // yin
  'iŋ', // ying
  'i̯ʊŋ', // yong
  'u', // wu
  'u̯ɑ', // wa
  'u̯aɪ̯', // wai
  'u̯eɪ̯', // wei
  'u̯ɔ', // wo
  'u̯an', // wan
  'u̯ɑŋ', // wang
  'u̯ən', // wen
  'u̯əŋ', // weng
  'y', // yu
  'y̯œ', // yue
  'y̯ɛn', // yuan
  'yn', // yun
];

const zhuyin_cache = new Map();
const ipa_cache = new Map();

class PinyinConverter {
  static is_name(pin: string, meaning: string): boolean {
    const nmarkre = /\(\s*name\s*\)/i;
    const nre = /^(\p{Lu}[\p{LC}\s]+)/u;
    const spacere = /\s/g;

    if (nmarkre.test(meaning)) {
      return true;
    }
    pin = pin
      .normalize('NFD')
      .replaceAll(unicodeToneRe, '')
      .normalize('NFC')
      .toLowerCase()
      .replaceAll(spacere, '');
    meaning = meaning
      .normalize('NFD')
      .replaceAll(unicodeToneRe, '')
      .normalize('NFC');
    const result = meaning.match(nre);
    if (!result) {
      return false;
    }
    const mpart = result[0].replaceAll(spacere, '').toLowerCase();
    return mpart.length > 0 && pin.length > 0 && mpart === pin;
  }

  static normalize_pinyin(pin: string): string {
    const funkyu = 'ü'.normalize('NFD');
    pin = pin.trim().toLowerCase();
    pin = pin.normalize('NFD').replaceAll(unicodeToneRe, '');
    pin = pin.replaceAll(funkyu, 'v');
    if (pin === 'r') {
      pin = 'er';
    }
    return pin;
  }

  static split_pinyin(pin: string): [number, number] {
    const no_initial_chars = new Set(['a', 'e', 'o', 'y', 'w']);

    if (no_initial_chars.has(pin[0])) {
      return [-1, pinyin_no_initial.findIndex(i => i === pin)];
    }
    const ilen = pin[1] === 'h' ? 2 : 1;
    const iidx = pinyin_initial.findIndex(
      i => i.length === ilen && pin.startsWith(i)
    );
    if (iidx === -1) {
      return [-1, -1];
    }
    const pinitial = pinyin_initial[iidx];
    let pfinal = pin.substr(ilen);
    if (
      (pinitial === 'j' || pinitial === 'q' || pinitial === 'x') &&
      pfinal[0] === 'u'
    ) {
      pfinal = 'v'.concat(pfinal.substr(1));
    }
    return [iidx, pinyin_final.findIndex(i => i === pfinal)];
  }

  static convert_zhuyin(pin: string, _tone: number): string {
    pin = this.normalize_pinyin(pin);
    const cached = zhuyin_cache.get(pin);
    if (cached) {
      return cached;
    }
    const pi_no_zf = new Set(['zh', 'sh', 'ch', 'z', 's', 'c', 'r']);

    const [iidx, fidx] = this.split_pinyin(pin);
    if (iidx < 0) {
      const result = zhuyin_final[fidx];
      if (result) {
        zhuyin_cache.set(pin, result);
        return result;
      } else {
        return '(??P)';
      }
    }
    if (fidx < 0) {
      return '(??F)';
    }
    const zinitial = zhuyin_initial[iidx];
    if (pinyin_final[fidx] === 'i' && pi_no_zf.has(pinyin_initial[iidx])) {
      if (zinitial) {
        zhuyin_cache.set(pin, zinitial);
      }
      return zinitial ?? '??ZI';
    }
    const zfinal = zhuyin_final[fidx];
    if (zinitial && zfinal) {
      zhuyin_cache.set(pin, zinitial.concat(zfinal));
    }
    return zinitial?.concat(zfinal ?? '(?F)') ?? '(?I)';
  }

  static convert_ipa(pin: string, _tone: number): string {
    pin = this.normalize_pinyin(pin);
    const cached = ipa_cache.get(pin);
    if (cached) {
      return cached;
    }

    const [iidx, fidx] = this.split_pinyin(pin);
    if (iidx < 0) {
      const result = ipa_final[fidx];
      if (result) {
        ipa_cache.set(pin, result);
        return result;
      } else {
        return '(??P)';
      }
    }
    if (fidx < 0) {
      return '(??F)';
    }
    const ipainitial = ipa_initial[iidx];
    const ipafinal = ipa_final[fidx];
    if (ipainitial && ipafinal) {
      ipa_cache.set(pin, ipainitial.concat(ipafinal));
    }
    return ipainitial?.concat(ipafinal ?? '(?F)') ?? '(?I)';
  }
}

export {PinyinConverter};
