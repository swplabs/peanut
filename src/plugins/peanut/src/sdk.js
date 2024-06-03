/* global pfwp */

const ns = 'pfwp_';

const head = document.getElementsByTagName('head')[0];
let inlineJsContainer;

const getElementId = (element) => {
  let id = '';

  if (element && !element.id) {
    console.log('dispatch|subscribe: element needs an id attribute');
  } else if (element) {
    id = `-${element.id.match(/[a-z0-9]+$/)}`;
  }

  return id;
};

let apiPath = '/wp-json/pfwp/v1/components/';

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
        const id = `pfwp_${assetType}_${component}_${index}`;

        if (assetType === 'js') {
          if (inlineJsContainer && inlineJsContainer.querySelector(`#${id}`)) {
            resolve();
            return;
          }

          const s = document.createElement('script');
          s.src = asset;
          s.async = 1;
          s.fetchPriority = 'low';
          s.id = id;
          s.onload = () => {
            resolve();
          };
          s.onerror = (event) => {
            reject(event);
          };

          if (inlineJsContainer) {
            inlineJsContainer.appendChild(s);
          }
        } else {
          if (head.querySelector(`#${id}`)) {
            resolve();
            return;
          }

          const l = document.createElement('link');
          l.id = id;
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
  },

  setApiPath: (path) => {
    apiPath = path;
  },

  getApiPath: () => apiPath,

  getComponentJs: (component) => {
    const clientJs = window.peanutSrcClientJs?.[`view_components_${component}`];

    let componentJs;

    if (typeof clientJs === 'function') {
      componentJs = clientJs;
    } else if (
      clientJs &&
      clientJs.hasOwnProperty('default') &&
      typeof clientJs.default === 'function'
    ) {
      componentJs = clientJs.default;
    }

    return componentJs;
  },

  runComponentJs: (component, instances = {}) => {
    const componentJs = pfwp.getComponentJs(component);

    if (componentJs) {
      Object.keys(instances).forEach((instance) => {
        componentJs(document.getElementById(instance), instances[instance]);
      });
    }
  },

  lazyLoadObserver: new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      const { target, isIntersecting } = entry;
      if (isIntersecting) {
        observer.unobserve(target);
  
        pfwp.dispatch('onObserve', {}, target);
      }
    });
  })
};


document.addEventListener('DOMContentLoaded', () => {
  pfwp.dispatch('pageDomLoaded', {});
});

module.exports = (instance, data) => {
  const {
    components: { js: componentJs },
    metadata: { js: metadataJs = {} }
  } = data;

  inlineJsContainer = instance;

  // Trigger inlined components javascript
  Object.keys(metadataJs).forEach((key) => {
    if (metadataJs[key].async === false) {
      pfwp.runComponentJs(key, window.pfwp_comp_instances[key]);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Load and trigger async components javascript
    Object.keys(componentJs)
      .filter((key) => metadataJs[key]?.async !== false)
      .forEach((key) => {
        pfwp.getComponentAssets(key, componentJs[key], () => {
          pfwp.runComponentJs(key, window.pfwp_comp_instances[key]);
        });
      });
  });
};
