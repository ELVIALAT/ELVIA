// Tests del módulo jobs (SSRF + service con mocks).
jest.mock('../../src/modules/jobs/jobs.repository');
const { isAllowedJobUrl } = require('../../src/modules/jobs/jobs.ssrf');
const repo = require('../../src/modules/jobs/jobs.repository');
const svc = require('../../src/modules/jobs/jobs.service');

describe('jobs.ssrf.isAllowedJobUrl', () => {
  test('acepta dominios de empleo whitelisteados', () => {
    expect(isAllowedJobUrl('https://www.linkedin.com/jobs/view/123')).toBe(true);
    expect(isAllowedJobUrl('https://computrabajo.com/oferta')).toBe(true);
    expect(isAllowedJobUrl('https://jobs.lever.co/acme/123')).toBe(true);
    // subdominios de un dominio permitido también pasan
    expect(isAllowedJobUrl('https://mx.indeed.com/viewjob')).toBe(true);
  });

  test('rechaza dominios no permitidos (anti-SSRF)', () => {
    expect(isAllowedJobUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedJobUrl('http://localhost:3000/admin')).toBe(false);
    expect(isAllowedJobUrl('https://evil.com/phishing')).toBe(false);
  });

  test('rechaza protocolos no http(s)', () => {
    expect(isAllowedJobUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedJobUrl('ftp://linkedin.com')).toBe(false);
  });

  test('rechaza URLs malformadas', () => {
    expect(isAllowedJobUrl('no-es-una-url')).toBe(false);
    expect(isAllowedJobUrl('')).toBe(false);
  });
});

describe('jobs.service.checkCompatibility', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve resultado cacheado sin llamar a IA', async () => {
    repo.getCachedCheck.mockResolvedValue({ score: 75, motivos: ['ok'] });
    const out = await svc.checkCompatibility({}, 'u1', { cvText: 'CV', jobTitle: 'Dev' });
    expect(out).toEqual({ score: 75, motivos: ['ok'], fromCache: true });
  });

  test('rechaza CV demasiado largo (413)', async () => {
    repo.getCachedCheck.mockResolvedValue(null);
    const cvLargo = 'x'.repeat(50001);
    await expect(svc.checkCompatibility({}, 'u1', { cvText: cvLargo, jobTitle: 'Dev' }))
      .rejects.toMatchObject({ status: 413 });
  });
});
