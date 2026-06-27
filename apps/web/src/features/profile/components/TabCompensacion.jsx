// features/profile/components/TabCompensacion.jsx
// Tab "Compensación" del Perfil. Extraído verbatim de pages/Perfil.jsx (Fase 3 refinamiento).
import { MONEDAS, getPrestaciones, MEXICO_DETALLE } from '../constants'
import HelpBadge from '../../../components/common/HelpBadge'

export default function TabCompensacion({
  form, set, setForm, togglePrestacion, updateDetalle,
}) {
  return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Compensación Deseada
              <HelpBadge id="perfil.compensacion" />
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Salario bruto mensual</label>
            <div className="flex gap-2">
              <select value={form.moneda} onChange={set('moneda')}
                className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0">
                {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                  {MONEDAS.find(m => m.code === form.moneda)?.symbol || '$'}
                </span>
                <input type="text" value={form.salario_monto} onChange={set('salario_monto')} placeholder="50,000"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            {form.pais && <p className="text-xs text-gray-400 mt-1">Moneda para {form.pais}: {form.moneda}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Prestaciones{form.pais ? ` — ${form.pais}` : ''}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {getPrestaciones(form.pais).map(p => {
                const detailCfg = form.pais === 'México' ? MEXICO_DETALLE[p] : null
                const isChecked = form.prestaciones.includes(p)
                return (
                  <div key={p}>
                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs
                      ${isChecked ? 'bg-primary/5 border-primary/30 text-primary font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => togglePrestacion(p)} className="accent-primary shrink-0" />
                      {p}
                    </label>
                    {isChecked && detailCfg && (
                      <div className="mt-1 px-1">
                        {detailCfg.tipo === 'selector' ? (
                          <select value={form.prestaciones_detalle[p] ?? detailCfg.default} onChange={e => updateDetalle(p, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none">
                            {detailCfg.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type={detailCfg.tipo === 'pct' || detailCfg.tipo === 'dias' ? 'number' : 'text'}
                              value={form.prestaciones_detalle[p] ?? detailCfg.default}
                              onChange={e => updateDetalle(p, e.target.value)}
                              placeholder={detailCfg.label}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none"
                            />
                            {detailCfg.tipo === 'pct'  && <span className="text-xs text-gray-400 shrink-0">%</span>}
                            {detailCfg.tipo === 'dias' && <span className="text-xs text-gray-400 shrink-0">días</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Variable o Bono */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-semibold text-gray-500">Variable o Bono</label>
              <button
                onClick={() => setForm(f => ({ ...f, bono_activo: !f.bono_activo, bono_tipo: '', bono_frecuencia: '', bono_monto: '', bono_pct: '', variable_monto: '' }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                  ${form.bono_activo ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                {form.bono_activo ? '✓ Aplica' : '+ Agregar'}
              </button>
            </div>
            {form.bono_activo && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex gap-2">
                  {['Bono', 'Variable mensual'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, bono_tipo: t }))}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors
                        ${form.bono_tipo === t ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {form.bono_tipo === 'Bono' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
                      <select value={form.bono_frecuencia} onChange={e => setForm(f => ({ ...f, bono_frecuencia: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Selecciona</option>
                        {['Mensual','Trimestral','Semestral','Anual'].map(frq => <option key={frq} value={frq}>{frq}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Monto ({form.moneda})</label>
                      <input type="text" value={form.bono_monto} onChange={e => setForm(f => ({ ...f, bono_monto: e.target.value }))} placeholder="50,000"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">%</label>
                      <input type="number" value={form.bono_pct} onChange={e => setForm(f => ({ ...f, bono_pct: e.target.value }))} placeholder="10" min="0" max="200"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}
                {form.bono_tipo === 'Variable mensual' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monto mensual ({form.moneda})</label>
                    <input type="text" value={form.variable_monto} onChange={e => setForm(f => ({ ...f, variable_monto: e.target.value }))} placeholder="10,000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Otras prestaciones — texto libre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Otras prestaciones o beneficios
              <span className="ml-1 font-normal text-gray-400">(texto libre)</span>
            </label>
            <textarea
              value={form.prestaciones_otros}
              onChange={set('prestaciones_otros')}
              rows={3}
              placeholder="Ej. seguro dental, días adicionales de vacaciones, acciones de la empresa..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
  )
}
