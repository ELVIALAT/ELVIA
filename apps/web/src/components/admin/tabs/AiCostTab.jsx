import React, { useState, useEffect, useCallback } from 'react'
import { ArrowClockwise, ChartLineUp, CurrencyDollar, Robot, Buildings, Lightning } from '@phosphor-icons/react'
import SectionHeading from '../shared/SectionHeading'
import { toast } from 'react-hot-toast'

const RANGES = [7, 30, 90]

const fmtUsd = (n) => {
  const v = Number(n || 0)
  if (v > 0 && v < 0.01) return `$${v.toFixed(6)}`
  return `$${v.toFixed(4)}`
}
const fmtNum = (n) => Number(n || 0).toLocaleString('es-MX')

const AiCostTab = ({ db, API_URL }) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState(30)

  const fetchCost = useCallback(async (d) => {
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/ai-cost?days=${d}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching ai-cost:', err)
      toast.error('No se pudo cargar el costo de IA')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [db, API_URL])

  useEffect(() => { fetchCost(days) }, [days, fetchCost])

  const tenants = data?.tenants || []
  const totals  = data?.totals || { calls: 0, costUsd: 0 }

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl">
      <SectionHeading
        title="Costo de IA"
        subtitle="Consumo de tokens y costo estimado por tenant"
        icon={ChartLineUp}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                  days === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchCost(days)}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-xl disabled:opacity-50"
          >
            <ArrowClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </SectionHeading>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { key: 'cost',    label: 'Costo estimado',  value: fmtUsd(totals.costUsd), icon: CurrencyDollar },
          { key: 'calls',   label: 'Llamadas de IA',  value: fmtNum(totals.calls),   icon: Lightning },
          { key: 'tenants', label: 'Tenants activos', value: fmtNum(tenants.length), icon: Buildings },
        ].map(({ key, label, value, icon: Icon }) => (
          <div key={key} className="bg-[#111827] rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-indigo-400">
                <Icon size={24} weight="duotone" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Últimos {days}d</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-tenant */}
      <div className="space-y-5">
        {loading && !data ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/50 rounded-[2rem] border border-slate-800 animate-pulse" />
          ))
        ) : tenants.length === 0 ? (
          <div className="bg-[#111827] rounded-[2rem] p-12 border border-slate-800 text-center">
            <Robot size={40} weight="duotone" className="text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin datos de costo en el período</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">
              El ledger registra cuando la migración ai_usage está aplicada y hay llamadas de IA.
            </p>
          </div>
        ) : tenants.map((t) => (
          <div key={t.company_id || 'sin-tenant'} className="bg-[#111827] rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h4 className="text-base font-black text-white italic uppercase tracking-tight truncate">
                  {t.name || t.company_id || 'Sin tenant'}
                </h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  {fmtNum(t.calls)} llamadas · {fmtNum(t.inputTokens)} in · {fmtNum(t.outputTokens)} out
                  {t.cacheReadTokens ? ` · ${fmtNum(t.cacheReadTokens)} cache` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-indigo-400 tracking-tight">{fmtUsd(t.costUsd)}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">estimado</p>
              </div>
            </div>
            {/* Breakdown por modelo */}
            <div className="space-y-2 pt-4 border-t border-slate-800/70">
              {(t.byModel || []).map((m, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 truncate">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${m.provider === 'claude' ? 'bg-indigo-400' : 'bg-teal-400'}`} />
                    {m.model}
                  </span>
                  <span className="font-black text-slate-500 tabular-nums shrink-0 ml-4">
                    {fmtNum(m.calls)}× · {fmtUsd(m.costUsd)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center pt-2">
        Costo estimado con tarifas aproximadas (platform/ai/cost/rates.js) — verificar vs precios oficiales.
      </p>
    </div>
  )
}

export default AiCostTab
