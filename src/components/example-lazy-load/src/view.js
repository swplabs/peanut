/* global PFWP */

const lazyLoadObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      const { target, isIntersecting } = entry;
      if (isIntersecting) {
        observer.unobserve(target);

        PFWP.dispatch('onObserve', {}, target);
      }
    });
  }
);

const lazyLoad = async ({ instance, componentName, dataString = '' }) => {
  const response = await fetch(`/wp-json/pfwp/v1/components/${componentName}/${dataString}`, {
    method: 'get'
  });

  const json = await response.json();

  if (!json) return;

  const { html, assets: jsonAssets = {}, data: jsonData } = json;

  let container = document.createElement('div');
  container.innerHTML = html;
  const component = container.removeChild(container.firstChild);
  container = null;

  instance.replaceWith(component);

  // TODO: Maintain order of assets using array in wp-json response?
  Object.keys(jsonAssets).forEach((jsonAssetKey) => {
    const assets = jsonAssets[jsonAssetKey]?.assets;
    const keyAssets =
      assets &&
      Object.keys(assets).reduce((accumulator, assetKey) => {
        accumulator.push(...assets[assetKey]);
        return accumulator;
      }, []);

    if (Array.isArray(keyAssets) && keyAssets.length) {
      PFWP.getComponentAssets(jsonAssetKey, keyAssets, () => {
        const clientJs = window.peanutSrcClientJs?.[`components_${jsonAssetKey}`];

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

        if (componentJs) {
          let elements = [];

          if (jsonAssetKey === componentName) {
            elements = [component];
          } else {
            elements = component.querySelectorAll(`[id^="${jsonAssetKey}"]`);
          }

          elements.forEach((element) => {
            const elementData = jsonData?.[jsonAssetKey]?.[element.id];
            componentJs(element, elementData);
          });
        }
      });
    }
  });
};

module.exports = async (instance, data) => {
  let dataString = '';

  const {
    attributes: {
      component: { data: component_data, name: component_name },
      conditional,
      observed = true
    }
  } = data;

  if (typeof component_name !== 'string') return;

  if (component_data) {
    dataString = `?data=${encodeURIComponent(
      JSON.stringify({
        attributes: component_data
      })
    )}`;
  }

  PFWP.subscribe('pageDomLoaded', async () => {
    const load = async () => {
      await lazyLoad({
        instance,
        componentName: component_name,
        dataString
      });
    };

    const lazy = async () => {
      if (observed) {
        PFWP.subscribe('onObserve', load, instance);
        lazyLoadObserver.observe(instance);
      } else {
        await load();
      }
    };

    if (conditional) {
      PFWP.subscribe(
        'lazyLoadCondition',
        (conditionData) => {
          const { condition } = conditionData;

          if (typeof condition === 'function') {
            if (condition({ instance, data })) {
              lazy();
            }
          }
        },
        instance
      );
    } else {
      await lazy();
    }
  });
};
