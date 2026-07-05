declare module '@storybook/react-webpack5' {
  export type Meta<T = unknown> = any;
  export type StoryObj<T = unknown> = any;
}

declare module 'storybook/test' {
  export const expect: any;
  export const userEvent: any;
  export const within: any;
}
