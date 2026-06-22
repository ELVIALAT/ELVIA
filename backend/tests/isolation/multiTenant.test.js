// Tests de aislamiento multi-tenant (Fase 1, tarea 3 / spec §6.2).
// Verifica con JWT de usuario REAL (anon key + RLS activo) que un usuario
// de Tenant A NUNCA puede leer datos de Tenant B.
//
// Requiere en backend/.env.staging: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// Correr con: npm run test:isolation
require('dotenv').config({ path: __dirname + '/../../.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY;
const STAGING_REF = 'evkxbvrbncbtpyvirzee';

// Guarda: nunca correr contra algo que no sea staging.
const isStaging = URL && URL.includes(STAGING_REF);

const admin = isStaging ? createClient(URL, SERVICE) : null;

// Datos de prueba (prefijo identificable para limpieza)
const TAG = 'isotest';
const userA = { email: `${TAG}.userA@example.com`, password: 'IsoTestA123!', id: null, company_id: null, cv_id: null };
const userB = { email: `${TAG}.userB@example.com`, password: 'IsoTestB123!', id: null, company_id: null, cv_id: null };
let companyA, companyB;

async function createUserWithCv(u, companyId) {
  const { data: auth } = await admin.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true,
  });
  u.id = auth.user.id;
  u.company_id = companyId;
  await admin.from('profiles').upsert({ id: u.id, email_principal: u.email, company_id: companyId, role: 'user' });
  const { data: cv } = await admin.from('cv_results')
    .insert({ user_id: u.id, company_id: companyId, tipo: 'optimize', contenido: `CV privado de ${u.email}` })
    .select('id').single();
  u.cv_id = cv.id;
}

async function loginClient(u) {
  const client = createClient(URL, ANON);
  const { error } = await client.auth.signInWithPassword({ email: u.email, password: u.password });
  if (error) throw new Error(`Login falló para ${u.email}: ${error.message}`);
  return client;
}

const describeOrSkip = (isStaging && ANON) ? describe : describe.skip;

describeOrSkip('Aislamiento multi-tenant (RLS con JWT real)', () => {
  let clientA;

  beforeAll(async () => {
    // 2 tenants
    const { data: cA } = await admin.from('companies')
      .insert({ name: `${TAG} Empresa A`, slug: `${TAG}-a`, type: 'corporate' }).select('id').single();
    const { data: cB } = await admin.from('companies')
      .insert({ name: `${TAG} Empresa B`, slug: `${TAG}-b`, type: 'corporate' }).select('id').single();
    companyA = cA.id; companyB = cB.id;

    await createUserWithCv(userA, companyA);
    await createUserWithCv(userB, companyB);

    clientA = await loginClient(userA);
  }, 30000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from('cv_results').delete().in('user_id', [userA.id, userB.id].filter(Boolean));
    for (const id of [userA.id, userB.id].filter(Boolean)) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
    await admin.from('companies').delete().in('id', [companyA, companyB].filter(Boolean));
  }, 30000);

  test('usuario A SÍ ve su propio cv_result', async () => {
    const { data } = await clientA.from('cv_results').select('id').eq('id', userA.cv_id);
    expect(data).toHaveLength(1);
  });

  test('usuario A NO ve el cv_result de B (por id directo)', async () => {
    const { data } = await clientA.from('cv_results').select('id').eq('id', userB.cv_id);
    expect(data).toHaveLength(0);
  });

  test('usuario A NO ve NINGÚN cv_result de la empresa B', async () => {
    const { data } = await clientA.from('cv_results').select('id').eq('company_id', companyB);
    expect(data).toHaveLength(0);
  });

  test('usuario A NO ve el profile de B', async () => {
    const { data } = await clientA.from('profiles').select('id').eq('id', userB.id);
    expect(data).toHaveLength(0);
  });

  test('usuario A select-all en cv_results devuelve SOLO su fila', async () => {
    const { data } = await clientA.from('cv_results').select('user_id');
    expect(data.every(row => row.user_id === userA.id)).toBe(true);
  });

  test('usuario A no puede INSERTAR un cv_result a nombre de B', async () => {
    const { error } = await clientA.from('cv_results')
      .insert({ user_id: userB.id, tipo: 'optimize', contenido: 'intento de spoof' });
    expect(error).toBeTruthy(); // RLS WITH CHECK lo rechaza
  });
});
