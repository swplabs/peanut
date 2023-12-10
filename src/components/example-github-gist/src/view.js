/* global PFWP */

const escapeHtml = (unsafe) =>
  unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(`'`, '&#039;');

const build = (files, selectContainer, buttons, codeContainer) => {
  const onchanges = [];

  const select = document.createElement('select');
  select.onchange = (e) => {
    const index = e.currentTarget?.selectedIndex;
    if (typeof index === 'number' && typeof onchanges[index] === 'function') onchanges[index]();
  };

  Object.keys(files).map((key, index) => {
    const file = files[key];

    const { content: fileContents = '', language = '', raw_url = '' } = file;

    const container = document.createElement('div');
    container.className = `highlightjs github-gist-file${
      index === 0 ? ' github-gist-file--active' : ''
    }`;

    const pre = document.createElement('pre');

    const code = document.createElement('code');
    code.innerHTML = escapeHtml(fileContents);
    code.className = `language-${language.toLowerCase()}`;
    window.hljs.highlightElement(code);

    pre.append(code);

    const option = document.createElement('option');
    option.text = language;
    option.value = index;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = `github-gist-button-container${
      index === 0 ? ' github-gist-button-container--active' : ''
    }`;
    const rawButton = document.createElement('div');
    rawButton.className = 'button';
    rawButton.innerHTML = '<span>Raw</span>';
    rawButton.onclick = () => {
      window.open(raw_url, '_blank');
    };
    const copyButton = document.createElement('div');
    copyButton.className = 'button';
    copyButton.innerHTML = '<span>Copy</span>';
    copyButton.onclick = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fileContents);
      } else {
        console.log('Secure context needed for copy');
      }
    };
    buttonContainer.append(rawButton);
    buttonContainer.append(copyButton);

    select.append(option);

    onchanges[index] = () => {
      codeContainer
        .querySelector('.github-gist-file--active')
        ?.classList.remove('github-gist-file--active');
      buttons
        .querySelector('.github-gist-button-container--active')
        ?.classList.remove('github-gist-button-container--active');

      container.classList.add('github-gist-file--active');
      buttonContainer.classList.add('github-gist-button-container--active');
    };

    buttons.append(buttonContainer);
    container.append(pre);
    codeContainer.append(container);
  });

  selectContainer.append(select);
};

module.exports = async (instance, data) => {
  const selectContainer = instance.querySelector('.github-gist-select');
  const buttons = instance.querySelector('.github-gist-buttons');
  const footer = instance.querySelector('.github-gist-footer');
  const title = instance.querySelector('.card-title');
  const codeContainer = instance.querySelector('.github-gist-code');

  const { gist_id } = data;

  if (typeof gist_id !== 'string') return;

  const response = await fetch(`https://api.github.com/gists/${gist_id}`);
  const gistData = await response.json();

  const { files = {}, html_url = '', description = 'Github Gist' } = gistData;

  title.innerText = description;

  footer.innerHTML = html_url
    ? `
    <a href="${html_url}" target="_blank"><i class="icon icon-github-circled"></i> View Github Gist</a>
  `
    : '';

  PFWP.getComponentAssets(
    'highlightjs',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
    () => {
      build(files, selectContainer, buttons, codeContainer);
    }
  );
};
