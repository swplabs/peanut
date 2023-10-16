require('./styles.scss');

let activeTab = '';
let component;

const onTabClick = (tabId) => (e) => {
  e.preventDefault();

  if (activeTab) {
    document.querySelector(`#${activeTab}`).classList.remove('active');
    document
      .querySelector(`.schema-content #${activeTab.replace('-tab', '-content')}`)
      .classList.remove('active');
  }

  document.querySelector(`#${tabId}`).classList.add('active');
  document
    .querySelector(`.schema-content #${tabId.replace('-tab', '-content')}`)
    .classList.add('active');

  activeTab = tabId;
  // console.log(window.parent.changeHash());
};

const init = () => {
  const control = document.getElementById('component-control');

  if (!control) return;

  component = control.dataset?.component;

  const tabs = control.querySelectorAll('.schema-tabs > div') || [];
  tabs.forEach((tab, i) => {
    if (i === 0) {
      tab.classList.add('active');
      document
        .querySelector(`.schema-content #${tab.id.replace('-tab', '-content')}`)
        .classList.add('active');
      activeTab = tab.id;
    }
    tab.onclick = onTabClick(tab.id);
  });

  control.querySelector('.schema-control')?.classList.add('show');
};

document.addEventListener('DOMContentLoaded', init);

const updateSrcParams = (params) => {
  if (!params) return;

  window.parent.peanutApp.updateHash(
    {
      compSrc: `/prototypes/${component}?${params}`,
      contSrc: `/schema/${component}/?${params}`
    },
    ['contSrc']
  );
};

window.peanutSchema = {
  updateSrcParams
};
