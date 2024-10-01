/* global __ROUTES__ */

const hashUtils = require('./hash.js');
const { toCamelCase } = require('../../../../../../shared/utils.js');

// TODO: can this be window.routes?
const routes = __ROUTES__;
const appNav = document.createElement('ul');
const iframeComponents = document.getElementById('iframe_components');
const iframeControl = document.getElementById('iframe_control');

let paramsToIgnore = [];

const onHashChange = () => {
  const params = hashUtils.parseHash();

  const { pathname: compPath, search: compSearch } =
    document.getElementById('iframe_components').contentWindow.location;

  if (!paramsToIgnore.includes('compSrc') && params.compSrc !== `${compPath}${compSearch}`) {
    iframeComponents.src = params.compSrc || '/page/home/';
  }

  const { pathname: contPath, search: contSearch } =
    document.getElementById('iframe_control').contentWindow.location;

  // TODO: update control to component if compsrc onload tells us a new component loaded "inline"
  if (!paramsToIgnore.includes('contSrc') && params.contSrc !== `${contPath}${contSearch}`) {
    iframeControl.src = params.contSrc || '/schema/';
  }

  paramsToIgnore = [];
};

const init = () => {
  document.querySelector('.app_logo').onclick = () => {
    hashUtils.updateHash();
  };

  const { variations = {} } = window.peanutApp;

  routes
    .filter(({ type }) => type === 'element')
    .map((route) => {
      const { id, url, title, path } = route;
      const li = document.createElement('li');
      const variationParams = variations[id];

      const button = document.createElement('button');
      button.onclick = function () {
        hashUtils.updateHash({
          compSrc: url,
          contSrc: `/schema/${path}/`
        });
      };

      button.innerText = title;

      li.appendChild(button);

      if (variationParams && Object.keys(variationParams)?.length) {
        const div = document.createElement('div');

        for (const [key, value] of Object.entries(variationParams)) {
          const variationBtn = document.createElement('button');
          variationBtn.innerText = toCamelCase(key);
          variationBtn.onclick = function () {
            hashUtils.updateHash({
              compSrc: `${url}?${value}`,
              contSrc: `/schema/${path}/?${value}`
            });
          };

          div.appendChild(variationBtn);
        }

        li.appendChild(div);
      }

      appNav.appendChild(li);
    });

  document.getElementById('app_navi').appendChild(appNav);

  onHashChange();

  window.addEventListener('hashchange', onHashChange);

  iframeComponents.addEventListener('load', () => {
    const { pathname, search } =
      document.getElementById('iframe_components').contentWindow.location;

    hashUtils.updateHash({
      compSrc: `${pathname}${search}`
    });
  });
};

const updateHash = (params, updatesToIngore = []) => {
  paramsToIgnore = updatesToIngore;
  hashUtils.updateHash(params);
};

module.exports = {
  updateHash,
  init,
  onHashChange
};
