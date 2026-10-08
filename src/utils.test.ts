import { extractErrorMessagesFromResponse } from './utils';

describe('extractErrorMessagesFromResponse', () => {
  const message =
    '[Duplicate payment attribute value &#39;abc 2&#39; found for attribute type &#39;Reference Number&#39; across multiple payments in the same bill]';

  it.each([{ message }, { globalErrors: [{ message }] }, { fieldErrors: { payments: [{ message }] } }])(
    'presents duplicate attributes as plain, concise text',
    (error) => {
      expect(extractErrorMessagesFromResponse({ error })).toBe(
        "Duplicate payment attribute: Reference Number 'abc 2' is already used on this invoice.",
      );
    },
  );

  it.each([undefined, {}, { error: {} }])('handles missing error details', (response) => {
    expect(extractErrorMessagesFromResponse(response)).toBe('An error occurred');
  });

  it('retains other validation messages as text without interpreting markup', () => {
    expect(extractErrorMessagesFromResponse({ error: { message: 'Validation => Use &lt;valid&gt; reference' } })).toBe(
      'Use <valid> reference',
    );
  });

  it.each([
    { fieldErrors: { referenceCode: [] }, message: 'Reference is required' },
    { fieldErrors: { referenceCode: [null, {}, { message: '' }] }, message: 'Reference is required' },
    { fieldErrors: { referenceCode: null }, globalErrors: [{ message: 'Reference is required' }] },
    { globalErrors: [{}], message: 'Reference is required' },
  ])('falls back when validation arrays have no usable messages', (error) => {
    expect(extractErrorMessagesFromResponse({ error })).toBe('Reference is required');
  });
});
