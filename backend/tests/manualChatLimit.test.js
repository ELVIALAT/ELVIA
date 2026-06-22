// backend/tests/manualChatLimit.test.js

describe('manualChatLimit', () => {
  function freshLimit() {
    jest.resetModules();
    return require('../src/middleware/manualChatLimit');
  }

  function mockReqRes(userId) {
    const req = { user: { id: userId } };
    const jsonFn = jest.fn();
    const status = jest.fn(() => ({ json: jsonFn }));
    const res = { status };
    const next = jest.fn();
    return { req, res, next, status, jsonFn };
  }

  test('rechaza con 401 si no hay req.user.id', () => {
    const limit = freshLimit();
    const req = {};
    const jsonFn = jest.fn();
    const status = jest.fn(() => ({ json: jsonFn }));
    const res = { status };
    const next = jest.fn();
    limit(req, res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite hasta 10 peticiones en 60s', () => {
    const limit = freshLimit();
    for (let i = 0; i < 10; i++) {
      const { req, res, next } = mockReqRes('user-allow');
      limit(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  test('bloquea la 11a peticion en 60s con 429', () => {
    const limit = freshLimit();
    for (let i = 0; i < 10; i++) {
      const { req, res, next } = mockReqRes('user-block');
      limit(req, res, next);
    }
    const { req, res, next, status } = mockReqRes('user-block');
    limit(req, res, next);
    expect(status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });
});
