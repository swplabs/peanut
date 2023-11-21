const srcDirEntMap = {
  'template.hbs': {
    flag: 'hasSrcTemplate',
    entryKey: 'hbs_template',
    excludeSrcTypes: ['blocks', 'components', 'themes', 'plugins'],
    buildCfg: {
      server: {
        entry: {
          enabled: true,
          library: {
            type: 'commonjs2'
          }
        }
      }
    },
    exportCfg: {
      web: {
        entry: {
          enabled: true,
          library: {
            type: 'window',
            name: ['peanutComps', '[name]']
          },
          buildTypes: ['elements']
        }
      }
    }
  },
  'variations.json': {
    flag: 'hasVars',
    entryKey: 'variations',
    excludeSrcTypes: ['themes', 'plugins'],
    buildCfg: {
      server: {
        entry: {
          enabled: true,
          library: {
            type: 'commonjs2'
          }
        }
      }
    },
    exportCfg: {}
  },
  // TODO: for plugin/block client side styles will we need to adjust the library type?
  'styles.scss': {
    flag: 'hasStyles',
    entryKey: 'styles',
    buildCfg: {
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
    exportCfg: {
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
    buildCfg: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportCfg: {
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
    buildCfg: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportCfg: {
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
  'editor-script.js': {
    flag: 'hasEditorScript',
    entryKey: 'editor',
    buildCfg: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportCfg: {
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
  'editor-styles.js': {
    flag: 'hasEditorStyles',
    entryKey: 'editor_styles',
    buildCfg: {
      elements: {
        entry: {
          enabled: true
        }
      }
    },
    exportCfg: {
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
  'client.js': {
    flag: 'hasSrcClient',
    buildCfg: {
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
    exportCfg: {
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
  srcDirEntMap
};
