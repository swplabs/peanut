const srcDirectories = {
  blocks: {
    buildTypes: ['elements'],
    pattern: '',
    webpack: {
      configPresets: {},
      plugins: {}
    }
  },
  components: {
    buildTypes: ['elements'],
    pattern: '',
    webpack: {
      configPresets: {},
      plugins: {}
    }
  },
  plugins: {
    buildTypes: ['elements'],
    pattern: '',
    webpack: {
      configPresets: {},
      plugins: {}
    }
  },
  themes: {
    buildTypes: ['elements'],
    pattern: '',
    webpack: {
      configPresets: {},
      plugins: {}
    }
  },
  whiteboard: {
    buildTypes: ['elements', 'server'],
    pattern: null,
    webpack: {
      configPresets: {
        enableCssInJs: false
      },
      plugins: {}
    }
  }
};

const srcDirectoryEntryMap = {
  'variations.json': {
    flag: 'hasVariations',
    entryKey: 'variations',
    excludeSrcTypes: ['themes', 'plugins'],
    buildConfig: {
      server: {
        entry: {
          enabled: true,
          library: {
            type: 'commonjs2'
          }
        }
      }
    },
    exportConfig: {}
  },
  // TODO: for plugin/block client side styles will we need to adjust the library type?
  // TODO: add pattern match so that we can use "editor.s?css"
  'style.scss': {
    flag: 'hasStyle',
    entryKey: 'style',
    buildConfig: {
      elements: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutSrcStylesJs', '[name]']
          }
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  'index.php': {
    flag: 'hasIndexPhp',
    entryKey: 'php_index',
    excludeSrcTypes: ['themes', 'plugins'],
    buildConfig: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  'render.php': {
    flag: 'hasRenderPhp',
    entryKey: 'php_render',
    excludeSrcTypes: ['themes', 'plugins'],
    buildConfig: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  // TODO: Add pattern/alias "index.js"
  'editor.js': {
    flag: 'hasEditorScript',
    entryKey: 'editor',
    buildConfig: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  // TODO: add pattern/alias match so that we can use "editor.s?css" and "index.s?css"
  'editor.scss': {
    flag: 'hasEditorStyle',
    entryKey: 'editor_style',
    buildConfig: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  'view.js': {
    flag: 'hasViewScript',
    entryKey: 'view',
    buildConfig: {
      elements: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutSrcClientJs', '[name]']
          }
        }
      }
    },
    exportConfig: {
      wordpress: {
        port: {
          enabled: true
        }
      }
    }
  },
  'render.js': {
    flag: 'hasRenderJs',
    entryKey: 'js_render',
    buildConfig: {
      server: {
        entry: {
          enabled: true,
          library: {
            type: 'commonjs2'
          }
        }
      }
    }
  }
};

const entryMapFlagKeys = Object.keys(srcDirectoryEntryMap).reduce((flagKeys, key) => {
  const { flag, entryKey } = srcDirectoryEntryMap[key];

  flagKeys.push({
    flag,
    entryKey,
    pattern: key
  });

  return flagKeys;
}, []);

module.exports = {
  srcDirectoryEntryMap,
  entryMapFlagKeys,
  srcDirectories
};
