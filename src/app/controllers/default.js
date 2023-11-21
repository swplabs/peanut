const { debug: log } = require('../shared/utils.js');
const {
  buildClientAssets,
  getServerFile,
  resetAssets,
  addParamsToData
} = require('./lib/utils.js');

let componentJs = [];
let componentCss = [];

const getComponentData = async ({
  /*
  compRoute,
  compId
  */
  initialData
}) => {
  // const { hasSsrReact, path, url } = compRoute;

  let data = initialData || {};

  /*
  // Add SSR data
  if (hasSsrReact) {
    const ssr = await getServerFile(`ssr_react_${compId}.js`);
    const ssrRender = ssr?.default?.render;
    data['_ssr_render'] = ssrRender;
  }
  */

  return data;
};

const addComponentAssets = ({
  compRoute,
  compId,
  compTemplateRef = '',
  disableSrcClient = false,
  isSubComp = false
}) => {
  const { templateType, hasStyles, hasSrcClient, type, srcType } = compRoute;

  const js = [];
  const css = [];

  // Get static assets
  const hpAssetId =
    type === 'prototype' && templateType === 'default' ? 'hbs_prototype' : 'proto_' + compId;

  const { js: baseJsAsset = '', css: baseCssAsset = '' } =
    buildClientAssets({ srcType, id: compId }) || {};

  const { js: protoJsAsset = '', css: protoCssAsset = '' } =
    buildClientAssets({ srcType, id: hpAssetId }) || {};

  if (!isSubComp && protoCssAsset) css.push(protoCssAsset);
  if (baseCssAsset) css.push(baseCssAsset);

  // TODO: if no css extraction, use stylesJsAsset
  if (hasStyles) {
    const { css: stylesCssAsset = '' } =
      buildClientAssets({ srcType, id: 'styles_' + compId }) || {};
    if (stylesCssAsset) css.push(stylesCssAsset);
  }

  if (baseJsAsset) js.push(baseJsAsset);

  if (isSubComp || protoJsAsset) {
    if (protoJsAsset) js.push(protoJsAsset);

    if (!disableSrcClient && hasSrcClient) {
      js.push(
        `<script>window?.peanutHbsPrototypeClientJs?.callComponentClientJs(window?.peanutSrcClientJs['${compId}'], '${compTemplateRef}')</script>`
      );
    }
  }

  componentJs.push(...js);
  componentCss.push(...css);
};

const controller = ({ route }) => {
  return async ({ req }) => {
    const {
      id,
      title,
      type,
      templateType,
      initialData,
      hasSrcTemplate,
      hasSrcClient,
      hasSchema,
      srcType
    } = route;

    // TODO: add back response caching using some sort of hash of url/searchparams
    log('[server] Getting controller response:', id);

    resetAssets({ srcType });

    componentJs = [];
    componentCss = [];

    const searchParams = hasSchema
      ? new URL(req.url, `http://${req.headers?.host}`)?.searchParams
      : null;

    const hbs_template_ref = `hbs_template_${id}`;

    const locals = {
      edit: false,
      peanutDisplayMode: true
    };

    const useDefaultTemplate = type === 'prototype' && templateType === 'default';

    const template = useDefaultTemplate
      ? await getServerFile('hbs_prototype.js')
      : await getServerFile(`hbs_${id}.js`);

    const srcTemplate = hasSrcTemplate ? await getServerFile(`${hbs_template_ref}.js`) : '';

    const overrideData = {};

    if (searchParams?.toString()) {
      addParamsToData(overrideData, {
        schema: (await getServerFile(`schema_${id}.js`))?.default || {},
        params: searchParams
      });
    }

    const data = await getComponentData({
      initialData,
      compRoute: route,
      compId: id,
      overrideData
    });

    const templateData =
      hasSrcClient && typeof srcTemplate !== 'function' && useDefaultTemplate ? data : {};

    addComponentAssets({
      compRoute: route,
      compId: id,
      compTemplateRef: hbs_template_ref,
      disableSrcClient: locals.edit
    });

    const rendSrcTemplate =
      typeof srcTemplate === 'function'
        ? srcTemplate({ ...data, locals, componentRef: hbs_template_ref, componentId: id })
        : '';

    return typeof template === 'function'
      ? template({
          title,
          header: title,
          componentRef: hbs_template_ref,
          componentId: id,
          ...templateData,
          locals,
          srcTemplate: rendSrcTemplate,
          js: componentJs.join('\n'),
          css: componentCss.join('\n')
        })
      : '<html><head></head><body>No Template Found for Page</body></html>';
  };
};

module.exports = {
  controller
};
