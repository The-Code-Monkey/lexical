// eslint-disable-next-line functional/functional-parameters
const joinClasses = (...args: (boolean | string | null | undefined)[]) =>
  args.filter(String).join(" ");

export default joinClasses;
