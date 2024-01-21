/* global pfwp */

const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    const { target, isIntersecting } = entry;
    if (isIntersecting) {
      observer.unobserve(target);

      pfwp.dispatch('onObserve', {}, target);
    }
  });
});

const apiPath = pfwp.getApiPath();

const lazyLoad = async ({ instance, componentName, dataString = '' }) => {
  const response = await fetch(`${apiPath}${componentName}/${dataString}`, {
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
      pfwp.getComponentAssets(jsonAssetKey, keyAssets, () => {
        const componentJs = pfwp.getComponentJs(jsonAssetKey);

        if (componentJs) {
          let elements = [];

          if (jsonAssetKey === componentName) {
            elements = [component];
          } else {
            elements = component.querySelectorAll(`[id^="${jsonAssetKey}"]`);
          }

          elements.forEach((element) =>
            componentJs(element, jsonData?.[jsonAssetKey]?.[element.id])
          );
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
      window.btoa(
        JSON.stringify({
          attributes: component_data
        })
      )
    )}`;
  }

  pfwp.subscribe('pageDomLoaded', async () => {
    const load = async () => {
      await lazyLoad({
        instance,
        componentName: component_name,
        dataString
      });
    };

    const lazy = async () => {
      if (observed) {
        pfwp.subscribe('onObserve', load, instance);
        lazyLoadObserver.observe(instance);
      } else {
        await load();
      }
    };

    if (conditional) {
      pfwp.subscribe(
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
