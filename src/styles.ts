import {ConfigKVs, themes} from './config';

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
  const wordSpacing = cfg.wordSpacing ?? false;

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

    #dchelper-translationtext, #dchelper-pinyintext {
      color: ${theme.textColor};
      padding-bottom: .5em;
      padding-top: .5em;
      font-size: 16pt;
      font-weight: normal;
      font-family: serif;
      font-style: normal;
    }

    #dchelper-pinyintext {
      font-family: sans-serif;
    }

    #dchelper-vocab {
      border-radius: .25em;
      border: ${theme.border};
      padding-left: 1em;
      padding-right: 1em;
      margin-top: .5em;
      margin-bottom: 1em;
      padding-top: 0px;
    }

    #dchelper-vocab table {
      margin-top: 1.5em;
      border-collapse: collapse;
      border: ${theme.borderSmall};
      letter-spacing: 1px;
      font-family: sans-serif;
      font-size: 0.8em;
    }
    #dchelper-vocab td, #dchelper-vocab th {
      border: ${theme.borderSmall};
      padding: 4px;
      white-space: nowrap;
    }
    #dchelper-vocab td.dch-vocabdef {
      white-space: normal;
    }

    .dchword {
      ${annoNormal ? `ruby-position: ${cfg.annoPosition};` : ''}
      ruby-align: center;
    }

    .dchword rt {
      white-space: pre-wrap;
      font-weight: 400;
      font-family: monospace;
      padding-left: 2pt;
      padding-right: 2pt;
      ${annoOnlyHover ? 'visibility: collapse;' : ''}
    }
    ${annoOnlyHover ? '.dchchunk:hover rt { visibility: visible; }' : ''}

    ${wordSpacing ? '.dchword + .dchword { padding-left: .3em; }' : ''}

    .dchpad, .dchpadhint { white-space: pre-wrap; }
    .dchpadhint { width: 16pxm; min-width: 16px; }

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
    .dchsyl {
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

export {applyStyles};
