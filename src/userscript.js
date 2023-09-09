import {Config, UserscriptConfigStore} from './config.ts';
import {applyStyles} from './styles.ts';
import {DCDocState, DCHState} from './helper_core';
import {bus, set_configuration} from './globals.ts';

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
  set_configuration(
    new Config(
      bus,
      new UserscriptConfigStore(GM_getValue, GM_setValue, GM_deleteValue)
    )
  );
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

export {initUserScript};
