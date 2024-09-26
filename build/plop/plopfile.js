module.exports = function (plop) {
  plop.setGenerator('component', {
    description: 'Create a new component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:'
      }
    ],
    actions: (_answers) => {
      let actions = [];

      // const { name } = answers;

      actions = actions.concat([
        {
          type: 'add',
          path: '{{dashCase name}}/view.js',
          templateFile: `./component/src/view.js.hbs`
        },
        {
          type: 'add',
          path: '{{dashCase name}}/style.scss',
          templateFile: './component/style.scss.hbs'
        }
      ]);

      return actions;
    }
  });
};
