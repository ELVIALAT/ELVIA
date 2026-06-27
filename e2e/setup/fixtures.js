// Datos de prueba compartidos para la suite E2E.
// Prefijo identificable para limpieza segura en teardown.
const TAG = 'e2etest';

const fixtures = {
  TAG,
  companyA: { name: `${TAG} Empresa A`, slug: `${TAG}-empresa-a`, id: null },
  companyB: { name: `${TAG} Empresa B`, slug: `${TAG}-empresa-b`, id: null },
  // Usuario candidato normal del tenant genérico 'publico'
  candidato: { email: `${TAG}.candidato@example.com`, password: 'E2eCandidato123!', id: null, nombre: 'Ana', apellido: 'Candidata' },
  // HR (company_admin) de Empresa A
  hrA: { email: `${TAG}.hr.a@example.com`, password: 'E2eHrA123!', id: null, nombre: 'Hugo', apellido: 'RecursosA' },
  // Colaborador de Empresa B (para probar que HR de A no lo ve)
  colabB: { email: `${TAG}.colab.b@example.com`, password: 'E2eColabB123!', id: null, nombre: 'Carla', apellido: 'ColabB' },
  // Entradas de allowlist marcadas: una en A (debe verse) y una en B (NUNCA debe
  // verse desde A). Sin la de B, un test de "B ausente" pasaría vacuosamente
  // porque el allowlist de A está vacío. Con ambas, la aserción es no-vacua en
  // los dos sentidos: A presente, B ausente.
  allowlistA: { email: `${TAG}.allow.a@example.com` },
  allowlistB: { email: `${TAG}.allow.b@example.com` },
};

module.exports = { fixtures };
