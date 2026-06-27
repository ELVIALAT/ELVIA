// Vista previa de CV en formato Harvard ATS-friendly
// Props:
//   datos    — estado del wizard (solo lectura cuando editable=false)
//   editable — boolean, activa inputs inline
//   onChange — fn(nuevosDatos) — requerida cuando editable=true

const S = {
  paper: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#111',
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 680,
    margin: '0 auto',
    padding: 'clamp(24px, 6vw, 52px) clamp(20px, 7vw, 60px)',
    boxSizing: 'border-box',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.4,
    margin: 0,
    textAlign: 'center',
  },
  contacto: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    margin: '6px 0 0',
    letterSpacing: 0.2,
  },
  dividerTop: {
    borderTop: '2px solid #111',
    marginTop: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    margin: '0 0 5px',
    paddingBottom: 3,
    borderBottom: '1px solid #555',
  },
  section: {
    marginBottom: 16,
  },
  expRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
    gap: 4,
  },
  expCargo: {
    fontSize: 11.5,
    fontWeight: 'bold',
    flex: '1 1 auto',
    minWidth: 0,
  },
  expFechas: {
    fontSize: 10,
    color: '#555',
    whiteSpace: 'nowrap',
    marginLeft: 10,
  },
  expEmpresa: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 3,
  },
  bullet: {
    margin: '0 0 0 16px',
    padding: 0,
    listStyle: 'disc',
  },
  bulletItem: {
    marginBottom: 2,
  },
  inlineList: {
    margin: '3px 0 0',
  },
  resumen: {
    margin: '3px 0 0',
    textAlign: 'justify',
  },
  eduRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
    gap: 4,
  },
  eduTitulo: {
    fontSize: 11.5,
    fontWeight: 'bold',
    flex: '1 1 auto',
    minWidth: 0,
  },
  eduAnio: {
    fontSize: 10,
    color: '#555',
    marginLeft: 10,
    whiteSpace: 'nowrap',
  },
  eduInst: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333',
  },
}

// Estilos base compartidos para inputs editables inline — mantienen apariencia del documento
const inputBase = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px dashed #a5b4fc',
  outline: 'none',
  fontFamily: 'inherit',
  color: 'inherit',
  padding: '1px 2px',
  width: '100%',
  boxSizing: 'border-box',
}

function EditableInput({ value, onChange, style, placeholder }) {
  return (
    <input
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputBase, ...style }}
    />
  )
}

function EditableTextarea({ value, onChange, style, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputBase, resize: 'vertical', display: 'block', ...style }}
    />
  )
}

function SectionTitle({ children }) {
  return <h2 style={S.sectionHeader}>{children}</h2>
}

function renderDescripcion(texto) {
  if (!texto) return null
  const lineas = texto.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
  if (lineas.length === 1) return <p style={{ margin: '2px 0 0' }}>{lineas[0]}</p>
  return (
    <ul style={S.bullet}>
      {lineas.map((l, i) => <li key={i} style={S.bulletItem}>{l}</li>)}
    </ul>
  )
}

export default function CVHarvardPreview({ datos, editable = false, onChange }) {
  if (!datos) return null

  const upd = (field, value) => onChange && onChange({ ...datos, [field]: value })
  const updExp = (i, field, value) => {
    const exps = (datos.experiencias || []).map((e, idx) => idx === i ? { ...e, [field]: value } : e)
    onChange && onChange({ ...datos, experiencias: exps })
  }
  const updEdu = (i, field, value) => {
    const edus = (datos.educacion || []).map((e, idx) => idx === i ? { ...e, [field]: value } : e)
    onChange && onChange({ ...datos, educacion: edus })
  }

  const nombre = [datos.nombre, datos.nombre2, datos.apellido, datos.apellido2]
    .filter(Boolean).join(' ')

  // No anteponer indicativo si el teléfono ya incluye código de país (+)
  const telefonoFmt = datos.telefono
    ? (datos.telefono.trim().startsWith('+')
        ? datos.telefono.trim()
        : `${datos.indicativo || ''} ${datos.telefono}`.trim())
    : null

  // No repetir país si ya está implícito en la ciudad
  const ubicacion = datos.ciudad || datos.pais
    ? [datos.ciudad, datos.pais].filter(Boolean).join(', ')
    : null

  const contacto = [datos.email, telefonoFmt, ubicacion].filter(Boolean).join(' · ')

  const exps = (datos.experiencias || []).filter(e => e.empresa || e.cargo)
  const edus = (datos.educacion || []).filter(e => e.institucion || e.titulo)
  const habs = datos.habilidades || []
  const idiomas = datos.idiomas || []

  return (
    <div style={S.paper}>

      {/* ── Encabezado ─────────────────────────────────── */}
      <div>
        {editable ? (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <EditableInput value={datos.nombre}    onChange={v => upd('nombre', v)}    style={{ ...S.name, textAlign: 'center', maxWidth: 160 }} placeholder="Nombre" />
            <EditableInput value={datos.nombre2}   onChange={v => upd('nombre2', v)}   style={{ ...S.name, textAlign: 'center', maxWidth: 120 }} placeholder="2do nombre" />
            <EditableInput value={datos.apellido}  onChange={v => upd('apellido', v)}  style={{ ...S.name, textAlign: 'center', maxWidth: 140 }} placeholder="Apellido" />
            <EditableInput value={datos.apellido2} onChange={v => upd('apellido2', v)} style={{ ...S.name, textAlign: 'center', maxWidth: 140 }} placeholder="2do apellido" />
          </div>
        ) : (
          <h1 style={S.name}>{nombre || '—'}</h1>
        )}

        {editable ? (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
            <EditableInput value={datos.email}   onChange={v => upd('email', v)}   style={{ ...S.contacto, maxWidth: 200 }} placeholder="Email" />
            <EditableInput value={datos.telefono} onChange={v => upd('telefono', v)} style={{ ...S.contacto, maxWidth: 160 }} placeholder="+52 55 1234 5678" />
            <EditableInput value={datos.ciudad}  onChange={v => upd('ciudad', v)}  style={{ ...S.contacto, maxWidth: 160 }} placeholder="Ciudad" />
            <EditableInput value={datos.pais}    onChange={v => upd('pais', v)}    style={{ ...S.contacto, maxWidth: 100 }} placeholder="País" />
          </div>
        ) : (
          contacto && <p style={S.contacto}>{contacto}</p>
        )}
      </div>

      <div style={S.dividerTop} />

      {/* ── Resumen Profesional ────────────────────────── */}
      {(datos.resumen || editable) && (
        <div style={S.section}>
          <SectionTitle>Resumen Profesional</SectionTitle>
          {editable
            ? <EditableTextarea value={datos.resumen} onChange={v => upd('resumen', v)} style={{ ...S.resumen, fontSize: 11 }} placeholder="Escribe tu resumen profesional..." rows={5} />
            : <p style={S.resumen}>{datos.resumen}</p>
          }
        </div>
      )}

      {/* ── Experiencia Laboral ────────────────────────── */}
      {(exps.length > 0 || editable) && (
        <div style={S.section}>
          <SectionTitle>Experiencia Laboral</SectionTitle>
          {(datos.experiencias || []).map((exp, i) => (
            <div key={i} style={{ marginBottom: i < (datos.experiencias.length - 1) ? 10 : 0 }}>
              {editable ? (
                <>
                  <div style={S.expRow}>
                    <EditableInput value={exp.cargo} onChange={v => updExp(i, 'cargo', v)} style={{ ...S.expCargo, maxWidth: '55%' }} placeholder="Cargo" />
                    <div style={{ display: 'flex', gap: 4, ...S.expFechas }}>
                      <EditableInput value={exp.fecha_inicio} onChange={v => updExp(i, 'fecha_inicio', v)} style={{ ...S.expFechas, width: 80 }} placeholder="Inicio" />
                      <span>–</span>
                      <EditableInput value={exp.fecha_fin} onChange={v => updExp(i, 'fecha_fin', v)} style={{ ...S.expFechas, width: 80 }} placeholder="Fin / Actualidad" />
                    </div>
                  </div>
                  <EditableInput value={exp.empresa} onChange={v => updExp(i, 'empresa', v)} style={{ ...S.expEmpresa, display: 'block' }} placeholder="Empresa" />
                  <EditableTextarea value={exp.descripcion} onChange={v => updExp(i, 'descripcion', v)} style={{ fontSize: 11 }} placeholder="Descripción de logros y responsabilidades..." rows={3} />
                </>
              ) : (
                <>
                  <div style={S.expRow}>
                    <span style={S.expCargo}>{exp.cargo || '—'}</span>
                    <span style={S.expFechas}>
                      {[exp.fecha_inicio, exp.fecha_fin || 'Actualidad'].filter(Boolean).join(' – ')}
                    </span>
                  </div>
                  {exp.empresa && <div style={S.expEmpresa}>{exp.empresa}</div>}
                  {exp.descripcion && renderDescripcion(exp.descripcion)}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Educación ──────────────────────────────────── */}
      {(edus.length > 0 || editable) && (
        <div style={S.section}>
          <SectionTitle>Educación</SectionTitle>
          {(datos.educacion || []).map((edu, i) => (
            <div key={i} style={{ marginBottom: i < (datos.educacion.length - 1) ? 6 : 0 }}>
              {editable ? (
                <>
                  <div style={S.eduRow}>
                    <EditableInput value={edu.titulo} onChange={v => updEdu(i, 'titulo', v)} style={{ ...S.eduTitulo }} placeholder="Título / Grado" />
                    <EditableInput value={edu.anio}   onChange={v => updEdu(i, 'anio', v)}   style={{ ...S.eduAnio, width: 60 }} placeholder="Año" />
                  </div>
                  <EditableInput value={edu.institucion} onChange={v => updEdu(i, 'institucion', v)} style={{ ...S.eduInst, display: 'block' }} placeholder="Institución" />
                </>
              ) : (
                <>
                  <div style={S.eduRow}>
                    <span style={S.eduTitulo}>{edu.titulo || '—'}</span>
                    {edu.anio && <span style={S.eduAnio}>{edu.anio}</span>}
                  </div>
                  {edu.institucion && <div style={S.eduInst}>{edu.institucion}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Habilidades ────────────────────────────────── */}
      {habs.length > 0 && (
        <div style={S.section}>
          <SectionTitle>Habilidades</SectionTitle>
          <p style={S.inlineList}>{habs.join(' · ')}</p>
        </div>
      )}

      {/* ── Idiomas ────────────────────────────────────── */}
      {idiomas.length > 0 && (
        <div style={{ ...S.section, marginBottom: 0 }}>
          <SectionTitle>Idiomas</SectionTitle>
          <p style={S.inlineList}>
            {idiomas.map(l => `${l.idioma}${l.nivel ? ` (${l.nivel})` : ''}`).join(' · ')}
          </p>
        </div>
      )}

    </div>
  )
}
