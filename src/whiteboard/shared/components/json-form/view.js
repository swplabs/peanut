const JsonForm = ({ schema }) => {
  return schema?.$schema ? <pre>{JSON.stringify(schema, null, 2)}</pre> : null;
};

export default JsonForm;
