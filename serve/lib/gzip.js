const zlib = require('zlib');

const getGzipData = function ({ acceptEncoding, content }) {
  // Compressed response
  if (/\bgzip\b/.test(acceptEncoding)) {
    return {
      headers: {
        'Content-Encoding': 'gzip'
      },
      content: zlib.gzipSync(content)
    };
  } else if (/\bdeflate\b/.test(acceptEncoding)) {
    return {
      headers: {
        'Content-Encoding': 'deflate'
      },
      content: zlib.deflateSync(content)
    };
  } else {
    return {
      headers: {},
      content
    };
  }
};

module.exports = {
  getGzipData
};
