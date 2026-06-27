// backend/tests/sentryScrub.test.js
// PII Shield: el scrubber NUNCA debe dejar pasar datos personales a Sentry.
const { scrubEvent, redactString } = require('../src/lib/sentryScrub');

describe('redactString', () => {
  test('redacta emails', () => {
    expect(redactString('falló para ana.lopez@empresa.com aquí'))
      .toBe('falló para [REDACTED_EMAIL] aquí');
  });

  test('redacta JWT/tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456';
    expect(redactString(`Bearer ${jwt}`)).toContain('[REDACTED_TOKEN]');
    expect(redactString(`Bearer ${jwt}`)).not.toContain('eyJ');
  });

  test('deja strings sin PII intactos', () => {
    expect(redactString('Error interno del servidor')).toBe('Error interno del servidor');
  });
});

describe('scrubEvent', () => {
  test('elimina el objeto user (email, ip, id)', () => {
    const event = { user: { email: 'x@y.com', ip_address: '1.2.3.4' }, message: 'ok' };
    expect(scrubEvent(event).user).toBeUndefined();
  });

  test('elimina el body del request', () => {
    const event = { request: { data: { cv: 'datos personales', password: 'secreto' } } };
    expect(scrubEvent(event).request.data).toBe('[REDACTED_BODY]');
  });

  test('redacta headers sensibles', () => {
    const event = { request: { headers: { authorization: 'Bearer xyz', 'content-type': 'application/json' } } };
    const out = scrubEvent(event);
    expect(out.request.headers.authorization).toBe('[REDACTED]');
    expect(out.request.headers['content-type']).toBe('application/json');
  });

  test('redacta email en el mensaje de excepción', () => {
    const event = { exception: { values: [{ value: 'no se encontró user@test.com' }] } };
    expect(scrubEvent(event).exception.values[0].value).toBe('no se encontró [REDACTED_EMAIL]');
  });

  test('descarta el evento (null) si el scrubbing lanza', () => {
    // Forzar error: breadcrumbs no iterable
    const event = { breadcrumbs: { [Symbol.iterator]: () => { throw new Error('boom') } } };
    expect(scrubEvent(event)).toBeNull();
  });
});
