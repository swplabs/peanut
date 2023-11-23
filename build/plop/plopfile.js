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
    actions: (answers) => {
      let actions = [];

      const { name } = answers;

      let clientSrc = 'src/view.js.hbs';

      actions = actions.concat([
        {
          type: 'add',
          path: '{{dashCase name}}/package.json',
          templateFile: './component/package.json.hbs'
        },
        {
          type: 'add',
          path: '{{dashCase name}}/README.md',
          templateFile: './component/README.md.hbs'
        }
      ]);

      // Add Client JS
      actions.push({
        type: 'add',
        path: '{{dashCase name}}/src/view.js',
        templateFile: `./component/${clientSrc}`
      });

      return actions;
    }
  });
};
