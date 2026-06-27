// Tests del módulo notifications (service + repository con mocks).
// Regla Fase 2: módulo migrado = módulo con tests.
const { sendCvByEmail, NotFoundError } = require('../../src/modules/notifications/notifications.service');
const { getOwnedCv } = require('../../src/modules/notifications/notifications.repository');

// Mock del query builder de Supabase (cadena .from().select().eq().eq().single())
function mockDb(returnRow) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => returnRow
      ? { data: returnRow, error: null }
      : { data: null, error: { message: 'no rows' } },
  };
  return { from: () => chain };
}

describe('notifications.repository.getOwnedCv', () => {
  test('devuelve el CV cuando existe', async () => {
    const db = mockDb({ contenido: 'CV', metadata: {}, tipo: 'optimize' });
    const cv = await getOwnedCv(db, 'cv-1', 'user-1');
    expect(cv).toEqual({ contenido: 'CV', metadata: {}, tipo: 'optimize' });
  });

  test('devuelve null cuando no existe (aislamiento por user_id)', async () => {
    const db = mockDb(null);
    const cv = await getOwnedCv(db, 'cv-de-otro', 'user-1');
    expect(cv).toBeNull();
  });
});

describe('notifications.service.sendCvByEmail', () => {
  test('lanza NotFoundError si el CV no es del usuario', async () => {
    const db = mockDb(null);
    const resend = { emails: { send: jest.fn() } };
    await expect(
      sendCvByEmail({ db, resend }, { to: 'a@b.com', cvId: 'x', format: 'pdf', userId: 'u' })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  test('envía el email con adjunto cuando el CV existe', async () => {
    // CV con contenido para que el nombre de archivo se genere
    const db = mockDb({ contenido: 'Juan Perez\nIngeniero', metadata: { language: 'es' }, tipo: 'optimize' });
    const send = jest.fn().mockResolvedValue({ id: 'email-1' });
    const resend = { emails: { send } };
    await sendCvByEmail({ db, resend }, { to: 'a@b.com', cvId: 'cv-1', format: 'pdf', userId: 'u' });
    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toEqual(['a@b.com']);
    expect(arg.attachments).toHaveLength(1);
    expect(arg.attachments[0].filename).toMatch(/CV Optimizado.*\.pdf/);
  });
});
