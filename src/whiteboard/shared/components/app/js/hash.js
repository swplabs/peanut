const parseHash = function () {
  const hash = window.location.hash;

  if (typeof hash !== 'string' || hash.length <= 0) {
    return {};
  }

  const rawParams = hash.substring(2).split('/');

  const params = {};

  rawParams.map(function (param) {
    const rawData = param.split('=');
    params[rawData[0]] = decodeURIComponent(rawData[1]);
  });

  return params;
};

const buildHash = function (hash) {
  let encodedHash = '';
  for (let prop in hash) {
    if (hash.hasOwnProperty(prop)) {
      encodedHash += '/' + prop + '=' + encodeURIComponent(hash[prop]);
    }
  }

  return '#' + encodedHash;
};

const updateHash = function (params) {
  const hash = parseHash();

  const newHash = params ? Object.assign({}, hash, params) : {};

  window.location.hash = buildHash(newHash);
};

module.exports = {
  updateHash,
  parseHash
};
