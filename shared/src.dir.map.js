const srcDirectoryEntryMap = {
  'variations.json': {
    flag: 'hasVars',
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
    flag: 'hasStyles',
    entryKey: 'styles',
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
    flag: 'hasEditorStyles',
    entryKey: 'editor_styles',
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
  // TODO: for plugin/block client side js will we need to adjust the library type if we do hot refresh?
  // TODO: add alias "view.js"
  'view.js': {
    flag: 'hasSrcClient',
    buildConfig: {
      elements: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutSrcClientJs', '[name]']
          }
        }
      },
      server: {
        entry: {
          enabled: true,
          library: {
            type: 'commonjs2'
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
  }
};

module.exports = {
  srcDirectoryEntryMap
};
