export const launchBillingWorkspace = (name: string, props?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('storybook:launch-billing-workspace', {
        detail: {
          name,
          props,
        },
      }),
    );
  }
};
