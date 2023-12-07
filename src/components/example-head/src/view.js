// PFWP Namespace
const ns = 'pfwp_';

window.PFWP = window.PFWP || {
  state: {},
  eventStates: {},
  dispatch: (propertyName, data) => {
    window.PFWP.eventStates[`${ns}${propertyName}`] = true;
    window.PFWP.state[`${ns}${propertyName}`] = data;
    document.dispatchEvent(
      new CustomEvent(`${ns}${propertyName}`, {
        detail: data
      })
    );
  },
  subscribe: (propertyName, callback) => {
    if (window.PFWP.eventStates[`${ns}${propertyName}`]) {
      callback(window.PFWP.state[`${ns}${propertyName}`]);
    }

    document.addEventListener(`${ns}${propertyName}`, (e) => {
      callback(e.detail);
    });
  },
  assetStates: {},
  getComponentAssets: (component, asset, callback, execAsset = false) => {
    const hasCb = typeof callback === 'function';
    const state = window.PFWP.assetStates[component];
    const eventName = `pfwp_loaded_${component}`;

    if (state !== 'loaded') {
      window.PFWP.subscribe(eventName, () => {
        if (hasCb) callback();
      });

      if (state !== 'loading') {
        window.PFWP.assetStates[component] = 'loading';

        const s = document.createElement('script');
        s.src = asset;
        s.async = 1;
        s.id = `pfwp_js_0_${component}`;
        s.onload = () => {
          window.PFWP.assetStates[component] = 'loaded';
          if (execAsset) {
            window.peanutSrcClientJs[`components_${component}`].default('', {});
          }
          window.PFWP.dispatch(eventName, {});
        };
        document.body.appendChild(s);
      }
    } else {
      if (hasCb) callback();
    }
  }
};
