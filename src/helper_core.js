// ==UserScript==
// @name        DC Helper
// @namespace   Violentmonkey Scripts
// @match       https://duchinese.net/*
// @version     0.6
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

import {configuration, bus} from './globals.ts';
import {mkElementTree} from './util.ts';
import {applyStyles} from './styles.ts';
import {Vocabulary} from './vocabulary.ts';
import {TrackPlayback} from './trackplayback';
import {CRD} from './crd';

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

function DCHelper(name, audio, crd) {
  const me = this;

  this.name = name;
  this.audio = audio;
  this.crd = new CRD(crd);
  this.vocab = new Vocabulary(this.crd.syls.i, this.crd.crd.words);

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
        {href: '#0', title: 'Toggle pinyin visibility'},
        '👀'
      );
      el.addEventListener('click', _evt => {
        document
          .getElementById('dchelper-pinyintext')
          ?.toggleAttribute('hidden');
        return false;
      });
      docChunk.appendChild(el);
    }

    {
      addSep();
      const el = mkElementTree(
        'a',
        {href: '#0', title: 'Toggle translation visibility'},
        '📜'
      );
      el.addEventListener('click', _evt => {
        document
          .getElementById('dchelper-translationtext')
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
    configuration.element.after(me.vocab.element(configuration));
    return true;
  }
  me.element = docChunk;

  updateChunk();
  me.update = updateChunk;
}

export {DCHelper, DCDocState, DCHState, CRD, TrackPlayback};
