/* global pfwp */

const ns = 'pfwp_';

const head = document.getElementsByTagName('head')[0];

const getElementId = (element) => {
  let id = '';

  if (element && !element.id) {
    console.log('dispatch|subscribe: element needs an id attribute');
  } else if (element) {
    id = `-${element.id.match(/[a-z0-9]+$/)}`;
  }

  return id;
};

window.pfwp = {
  state: {},

  eventStates: {},

  dispatch: (propertyName, data, element) => {
    const eventName = `${ns}${propertyName}${getElementId(element)}`;

    pfwp.eventStates[eventName] = true;
    pfwp.state[eventName] = data;

    const event = new CustomEvent(eventName, {
      detail: data
    });

    if (element) {
      element.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  },
  subscribe: (propertyName, callback, element) => {
    const eventName = `${ns}${propertyName}${getElementId(element)}`;

    if (pfwp.eventStates[eventName]) {
      callback(pfwp.state[eventName]);
    }

    const listener = (e) => {
      callback(e.detail);
    };

    if (element) {
      element.addEventListener(eventName, listener);
    } else {
      document.addEventListener(eventName, listener);
    }
  },

  assetStates: {},

  addAsset: ({ asset, component, index = 0 }) => {
    return new Promise((resolve, reject) => {
      try {
        const assetType = asset.endsWith('js') ? 'js' : 'css';

        // TODO: add check for existense of id on page
        if (assetType === 'js') {
          const s = document.createElement('script');
          s.src = asset;
          s.async = 1;
          s.id = `pfwp_${assetType}_${component}_${index}`;
          s.onload = () => {
            resolve();
          };
          s.onerror = (event) => {
            reject(event);
          };

          document.body.appendChild(s);
        } else {
          const l = document.createElement('link');
          l.id = `pfwp_${assetType}_${component}_${index}`;
          l.rel = 'stylesheet';
          l.type = 'text/css';
          l.href = asset;
          l.media = 'all';
          head.appendChild(l);
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  },

  getComponentAssets: async (component, assets = [], callback, execAsset = false) => {
    const hasCb = typeof callback === 'function';
    const state = pfwp.assetStates[component];
    const eventName = `component_loaded_${component}`;

    if (state !== 'loaded') {
      pfwp.subscribe(eventName, () => {
        if (hasCb) callback();
      });

      if (state !== 'loading') {
        pfwp.assetStates[component] = 'loading';

        const waitList = [];

        assets.forEach((asset, index) => {
          waitList.push(
            (async () => {
              try {
                await pfwp.addAsset({
                  asset,
                  component,
                  index
                });
              } catch (e) {
                console.log('getComponentAssets error', { component, asset }, e);
              }
            })()
          );
        });

        await Promise.all(waitList);

        pfwp.assetStates[component] = 'loaded';

        if (execAsset) {
          window.peanutSrcClientJs[`view_components_${component}`].default('', {});
        }

        pfwp.dispatch(eventName, {});
      }
    } else {
      if (hasCb) callback();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  pfwp.dispatch('pageDomLoaded', {});
});
