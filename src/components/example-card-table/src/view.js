module.exports = (instance) => {
  const closeButton = instance.querySelector('.card-head .button');
  closeButton.onclick = () => {
    instance.remove();
  };
};
