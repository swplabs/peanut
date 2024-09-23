/* eslint-disable */

const PageHeader = require('../components/PageHeader.js');
const RuntimeErrorStack = require('../components/RuntimeErrorStack.js');
const Spacer = require('../components/Spacer.js');
const ErrorStackParser = require('error-stack-parser');

const extendRuntimeError = (currentError) => {
  try {
    const errorStacks = ErrorStackParser.parse(currentError);
    if (
      currentError.message === 'Failed to fetch' &&
      errorStacks[0].fileName.includes('_webpack_runtime')
    ) {
      currentError.message =
        'Failed to fetch. (The webpack configuration and runtime for Peanut for Wordpress has been updated. Please reload this page to continue to use Hot Module Replacment.)';
      currentError.name = 'TypeError (Page Reload Required)';
    }
  } catch (e) {}

  return currentError;
};

/**
 * @typedef {Object} RuntimeErrorContainerProps
 * @property {Error} currentError
 */

/**
 * A container to render runtime error messages with stack trace.
 * @param {Document} document
 * @param {HTMLElement} root
 * @param {RuntimeErrorContainerProps} props
 * @returns {void}
 */
function RuntimeErrorContainer(document, root, props) {
  extendRuntimeError(props.currentError);

  PageHeader(document, root, {
    message: props.currentError.message,
    title: props.currentError.name,
    topOffset: '2.5rem'
  });
  RuntimeErrorStack(document, root, {
    error: props.currentError
  });
  Spacer(document, root, { space: '1rem' });
}

module.exports = RuntimeErrorContainer;
