/* global pfwp */

module.exports = {
  // loads js and and/or css for components
  data: async (data) => {
    Object.keys(data).forEach((key) => {
      const { assets: lazyLoadAssets, instances: lazyLoadInstances } = data[key];

      const componentData = window.pfwp_comp_instances[key];

      const combinedAssets = Object.keys(lazyLoadAssets).reduce((accumulator, assetKey) => {
        return accumulator.concat(lazyLoadAssets[assetKey]);
      }, []);

      const instanceData = {};

      lazyLoadInstances.forEach((instanceKey) => {
        if (componentData[instanceKey]) {
          instanceData[instanceKey] = componentData[instanceKey];
        }
      });

      // TODO: use load function instead
      // TODO: allow load on observe
      pfwp.getComponentAssets(key, combinedAssets, () => {
        const components = pfwp.runComponentJs(key, instanceData);

        components.forEach((component) => {
          component.setAttribute('data-pfwp-lazy-loader-status', 'loaded');
        });
      });
    });
  },

  load: async (instance, data) => {
    // TODO: check instance for resource type and determine how to load

    const {
      component: componentName,
      attributes: componentData,
      options: { conditional, observed = true, fetch_priority }
    } = data;

    if (typeof componentName !== 'string') return;

    pfwp.subscribe('pageDomLoaded', async () => {
      const load = async () => {
        await pfwp.asyncComponentLoad({
          instance,
          fetch_priority,
          componentName,
          componentData
        });
      };

      const lazy = async () => {
        if (observed) {
          pfwp.subscribe('onObserve', load, instance);
          pfwp.lazyLoadObserver.observe(instance);
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
  }
};
