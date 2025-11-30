/* global pfwp */

const LazyLoad = require('./js/lazy-load.js');

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

const normalizeAsset = (asset) => {
  const assetRegEx = new RegExp('/[a-zA-Z0-9-_]*(?<hash>.[a-zA-Z0-9]{20})?.(js|css)$');
  const { groups } = assetRegEx.exec(asset) || {};

  return groups?.hash ? asset.replace(groups.hash, '') : asset;
};

let apiPath = '/wp-json/pfwp/v1/components/';
let globalConfig = {};

const eventState = {};

window.pfwp = {
  loadedAssets: {},

  // TODO: allow either single or queue (ie. multiple stored waiting for subscribe) state for data passed via additional param
  dispatch: (propertyName, data, element) => {
    const eventName = `${ns}${propertyName}${getElementId(element)}`;

    eventState[eventName] = data;

    const event = new CustomEvent(eventName, {
      detail: data
    });

    if (element) {
      element.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  },

  subscribe: (propertyName, callback, element, useInitialState = true) => {
    const eventName = `${ns}${propertyName}${getElementId(element)}`;

    if (useInitialState && Object.hasOwn(eventState, eventName)) {
      callback(eventState[eventName]);
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

  // TODO: move to lazy-load.js
  addAsset: ({ asset, component, index = 0 }) => {
    return new Promise((resolve, reject) => {
      try {
        const assetType = asset.endsWith('js') ? 'js' : 'css';
        const id = `pfwp_${assetType}_${component}_${index}`;
        const normalizedAsset = normalizeAsset(asset);

        if (pfwp.loadedAssets[normalizedAsset]) {
          resolve();
          return;
        }

        if (assetType === 'js') {
          const s = document.createElement('script');
          s.src = asset;
          s.async = 1;
          s.fetchPriority = 'low';
          s.id = id;
          s.onload = () => {
            resolve();
          };
          s.onerror = (e) => {
            reject(e);
          };

          if (inlineJsContainer) {
            inlineJsContainer.appendChild(s);
            pfwp.loadedAssets[normalizedAsset] = true;
          }
        } else {
          const l = document.createElement('link');
          l.id = id;
          l.rel = 'stylesheet';
          l.type = 'text/css';
          l.href = asset;
          l.media = 'all';
          l.onload = () => {
            resolve();
          };
          l.onerror = (e) => {
            reject(e);
          };

          head.appendChild(l);
          pfwp.loadedAssets[normalizedAsset] = true;
        }
      } catch (e) {
        reject(e);
      }
    });
  },

  // TODO: move to lazy-load.js
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

        if (execAsset) {
          window.peanutSrcClientJs[`view_components_${component}`].default('', {});
        }

        pfwp.assetStates[component] = 'loaded';

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
    const components = [];

    if (componentJs) {
      Object.keys(instances).forEach((instance) => {
        const component = document.getElementById(instance);
        componentJs(component, instances[instance]);
        components.push(component);
      });
    }

    return components;
  },

  // TODO: move to lazy-load.js
  runLazyLoadJs: (instances = {}) => {
    Object.keys(instances).forEach((instance) => {
      LazyLoad.load(document.getElementById(instance), instances[instance]);
    });
  },

  // TODO: move to lazy-load.js
  lazyLoadObserver: new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      const { target, isIntersecting } = entry;
      if (isIntersecting) {
        observer.unobserve(target);

        pfwp.dispatch('onObserve', {}, target);
      }
    });
  }),

  // TODO: move to lazy-load.js
  asyncComponentLoad: async ({
    instance,
    fetch_priority: priority = 'low',
    componentName,
    componentData
  }) => {
    const { data_mode = 'path' } = globalConfig;

    let dataString = '';

    if (componentData && typeof componentData === 'object' && !Array.isArray(componentData)) {
      const base64Data = window.btoa(
        JSON.stringify({
          attributes: componentData
        })
      );

      dataString =
        data_mode !== 'path' ? `?data=${encodeURIComponent(base64Data)}` : `${base64Data}/`;
    }

    const response = await fetch(`${apiPath}${componentName}/${dataString}`, {
      method: 'get',
      priority
    });

    const json = await response.json();

    if (!json) return;

    const { html, assets: jsonAssets = {}, data: jsonData } = json;

    if (typeof html !== 'string' || html.length <= 0) {
      console.log(`asyncComponentLoad: ${componentName} returned no html`);
      return;
    }

    let container = document.createElement('div');
    container.innerHTML = html;
    const component = container.removeChild(container.firstChild);

    component.setAttribute('data-pfwp-lazy-loader-status', 'loading');

    container = null;

    instance.replaceWith(component);

    // TODO: Maintain order of assets using array in wp-json response?
    const waitList = [];

    Object.keys(jsonAssets).forEach((jsonAssetKey) => {
      const assets = jsonAssets[jsonAssetKey]?.assets;
      const keyAssets =
        assets &&
        Object.keys(assets).reduce((accumulator, assetKey) => {
          accumulator.push(...assets[assetKey]);
          return accumulator;
        }, []);

      if (Array.isArray(keyAssets) && keyAssets.length) {
        waitList.push(
          (async () => {
            await pfwp.getComponentAssets(jsonAssetKey, keyAssets, () => {
              const componentJs = pfwp.getComponentJs(jsonAssetKey);

              if (componentJs) {
                let elements = [];

                if (jsonAssetKey === componentName) {
                  elements = [component];
                } else {
                  elements = component.querySelectorAll(`[id^="${jsonAssetKey}"]`);
                }

                if (elements.length <= 0) {
                  // TODO: Only log in debug mode
                  /*
                  console.log(
                    `asyncComponentLoad: ${componentName} retrieved unused js - ${jsonAssetKey}`
                  );
                  */
                } else {
                  elements.forEach((element) =>
                    componentJs(element, jsonData?.[jsonAssetKey]?.[element.id] || {})
                  );
                }
              }
            });
          })()
        );
      }
    });

    await Promise.all(waitList);

    component.setAttribute('data-pfwp-lazy-loader-status', 'loaded');

    return component;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  pfwp.dispatch('pageDomLoaded', {});
});

module.exports = (instance, data) => {
  const {
    components: { js: componentJs, css: componentCss },
    metadata: { js: metadataJs = {} },
    lazy_load: lazyLoadData
  } = data;

  globalConfig = window.pfwp_global_config;

  inlineJsContainer = instance;

  // Store loaded component css
  Object.keys(componentCss)
    .filter((key) => Array.isArray(componentCss[key]))
    .forEach((key) => {
      componentCss[key].forEach((asset) => {
        pfwp.loadedAssets[normalizeAsset(asset)] = true;
      });
    });

  // Store and trigger inlined components javascript
  Object.keys(metadataJs).forEach((key) => {
    if (metadataJs[key].async === false) {
      componentJs[key].forEach((asset) => {
        pfwp.loadedAssets[normalizeAsset(asset)] = true;
      });

      pfwp.runComponentJs(key, window.pfwp_comp_instances[key]);
    }
  });

  // TODO: update pfwp.assetStates for already loaded components to be 'loaded'

  document.addEventListener('DOMContentLoaded', () => {
    // Load and trigger async components javascript
    Object.keys(componentJs)
      .filter((key) => metadataJs[key]?.async !== false)
      .forEach((key) => {
        pfwp.getComponentAssets(key, componentJs[key], () => {
          pfwp.runComponentJs(key, window.pfwp_comp_instances[key]);
        });
      });

    // Trigger full resource (html, js, and css) pfwp-lazy-loader sdk logic
    pfwp.runLazyLoadJs(window.pfwp_comp_instances['pfwp-lazy-loader']);

    // Trigger js resource lazy load sdk logic
    LazyLoad.data(lazyLoadData);
  });
};
