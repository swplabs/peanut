module.exports = async (instance) => {
  const cards = instance.querySelectorAll('.card');
  cards.forEach((card) => {
    const closeButton = card.querySelector('.card-head .button');
    closeButton.onclick = () => {
      card.remove();
    };
  });
};
