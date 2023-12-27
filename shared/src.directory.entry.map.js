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
      web: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutComps', '[name]']
          },
          buildTypes: ['elements']
        }
      },
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
      web: {
        port: {
          enabled: true
        }
      },
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
      web: {
        port: {
          enabled: true
        }
      },
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
      web: {
        port: {
          enabled: true
        }
      },
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
      web: {
        port: {
          enabled: true
        }
      },
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
      web: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutComps', '[name]']
          },
          buildTypes: ['elements']
        }
      },
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
  entryMapFlagKeys
};
