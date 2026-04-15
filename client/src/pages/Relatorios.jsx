import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Activity, Heart, Skull, DollarSign, TrendingUp, Scale, BarChart3, Target } from 'lucide-react'

function KpiCard({ icon: Icon, label, value, sub, gradient, glow }) {
  return (
    <Card className="group hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${glow}`}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-0.5 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GrowthChart({ curvas }) {
  if (!curvas || curvas.length === 0) return null

  // Achar max peso e max dias pra escala
  let maxPeso = 0, maxDias = 0
  curvas.forEach(c => c.pontos.forEach(p => {
    if (p.peso > maxPeso) maxPeso = p.peso
    if (p.diasVida > maxDias) maxDias = p.diasVida
  }))
  maxPeso = Math.ceil(maxPeso / 50) * 50 || 100
  maxDias = maxDias || 100

  const colors = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf', '#e879f9', '#84cc16', '#f87171']

  const W = 600, H = 250, PAD = 40
  const chartW = W - PAD * 2, chartH = H - PAD * 2

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px]">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={PAD} y1={PAD + chartH * (1 - f)} x2={PAD + chartW} y2={PAD + chartH * (1 - f)} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD - 5} y={PAD + chartH * (1 - f) + 4} fill="#6b7280" fontSize="10" textAnchor="end">{Math.round(maxPeso * f)}</text>
          </g>
        ))}
        {/* Axis labels */}
        <text x={PAD + chartW / 2} y={H - 5} fill="#6b7280" fontSize="10" textAnchor="middle">Dias de vida</text>
        <text x={12} y={PAD + chartH / 2} fill="#6b7280" fontSize="10" textAnchor="middle" transform={`rotate(-90, 12, ${PAD + chartH / 2})`}>Peso (kg)</text>
        {/* Lines */}
        {curvas.map((c, ci) => {
          if (c.pontos.length < 2) return null
          const points = c.pontos.map(p => {
            const x = PAD + (p.diasVida / maxDias) * chartW
            const y = PAD + chartH - (p.peso / maxPeso) * chartH
            return `${x},${y}`
          }).join(' ')
          return (
            <g key={c.id}>
              <polyline points={points} fill="none" stroke={colors[ci % colors.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {c.pontos.map((p, pi) => (
                <circle key={pi}
                  cx={PAD + (p.diasVida / maxDias) * chartW}
                  cy={PAD + chartH - (p.peso / maxPeso) * chartH}
                  r="3" fill={colors[ci % colors.length]}
                />
              ))}
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {curvas.map((c, ci) => (
          <div key={c.id} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[ci % colors.length] }} />
            <span className="text-gray-400">#{c.numero}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Relatorios() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.relatorios.geral().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Relatórios e KPIs</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
      </div>
    </div>
  )

  if (!data) return null

  const { reprodutivo, gmd, curvasCrescimento, mortalidade, financeiro, porTouro, pesoMedioDesmame, pesoSaidaPorSexo, lotacao } = data

  const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Relatórios e KPIs</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Heart} label="Taxa de Prenhez" value={`${reprodutivo.taxaPrenhez}%`} sub={`${reprodutivo.totalPrenhas} prenhas / ${reprodutivo.totalExpostas} expostas`} gradient="from-pink-400 to-rose-600" glow="shadow-pink-500/25" />
        <KpiCard icon={Activity} label="Taxa de Natalidade" value={`${reprodutivo.taxaNatalidade}%`} sub={`${reprodutivo.totalNascidos} nascidos`} gradient="from-blue-400 to-blue-600" glow="shadow-blue-500/25" />
        <KpiCard icon={Target} label="Taxa de Desmame" value={`${reprodutivo.taxaDesmame}%`} sub={`${reprodutivo.totalDesmamados} desmamados`} gradient="from-amber-400 to-orange-500" glow="shadow-amber-500/25" />
        <KpiCard icon={Skull} label="Mortalidade (Matrizes)" value={`${mortalidade.taxa}%`} sub={`${mortalidade.matrizesMortas} de ${mortalidade.totalMatrizes}`} gradient="from-gray-400 to-gray-600" glow="shadow-gray-500/25" />
      </div>

      {/* Peso médio saída por sexo + Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Scale} label="Peso Saída Machos" value={pesoSaidaPorSexo?.machos?.pesoMedio ? `${pesoSaidaPorSexo.machos.pesoMedio} kg` : '—'} sub={pesoSaidaPorSexo?.machos?.qtd ? `${pesoSaidaPorSexo.machos.qtd} animais` : ''} gradient="from-blue-400 to-cyan-600" glow="shadow-blue-500/25" />
        <KpiCard icon={Scale} label="Peso Saída Fêmeas" value={pesoSaidaPorSexo?.femeas?.pesoMedio ? `${pesoSaidaPorSexo.femeas.pesoMedio} kg` : '—'} sub={pesoSaidaPorSexo?.femeas?.qtd ? `${pesoSaidaPorSexo.femeas.qtd} animais` : ''} gradient="from-pink-400 to-rose-600" glow="shadow-pink-500/25" />
        <KpiCard icon={TrendingUp} label="Receita (Vendas)" value={fmt(financeiro.vendas)} gradient="from-emerald-400 to-green-600" glow="shadow-emerald-500/25" />
        <KpiCard icon={DollarSign} label="Despesas Registradas" value={fmt(financeiro.despesas)} gradient="from-red-400 to-red-600" glow="shadow-red-500/25" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Scale} label="Peso Médio Desmame" value={pesoMedioDesmame ? `${pesoMedioDesmame} kg` : '—'} gradient="from-cyan-400 to-cyan-600" glow="shadow-cyan-500/25" />
        <KpiCard icon={BarChart3} label="Custo Sanitário Total" value={fmt(financeiro.custoSanitario)} gradient="from-purple-400 to-purple-600" glow="shadow-purple-500/25" />
      </div>

      {/* Desempenho por Touro */}
      {porTouro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target size={18} className="text-purple-400" /> Desempenho por Touro / Sêmen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                  <TableHead>Touro</TableHead>
                  <TableHead>Inseminações</TableHead>
                  <TableHead>Prenhas</TableHead>
                  <TableHead>Taxa Sucesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porTouro.map(t => (
                  <TableRow key={t.touro}>
                    <TableCell className="font-semibold text-white">{t.touro}</TableCell>
                    <TableCell className="tabular-nums">{t.total}</TableCell>
                    <TableCell className="tabular-nums">{t.prenhas}</TableCell>
                    <TableCell>
                      <span className={`font-bold tabular-nums ${(t.taxa || 0) >= 70 ? 'text-emerald-400' : (t.taxa || 0) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {t.taxa || 0}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* GMD */}
      {gmd.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp size={18} className="text-emerald-400" /> GMD — Ganho Médio Diário (Na Fazenda)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                  <TableHead>Bezerro</TableHead>
                  <TableHead>Mãe</TableHead>
                  <TableHead>Peso Nasc.</TableHead>
                  <TableHead>Peso Atual</TableHead>
                  <TableHead>GMD (kg/dia)</TableHead>
                  <TableHead>Pesagens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gmd.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-semibold text-white">#{g.numero}</TableCell>
                    <TableCell>#{g.matriz_numero}</TableCell>
                    <TableCell className="tabular-nums">{g.peso_nascimento ? `${g.peso_nascimento} kg` : '—'}</TableCell>
                    <TableCell className="tabular-nums">{g.peso_atual ? `${g.peso_atual} kg` : '—'}</TableCell>
                    <TableCell>
                      {g.gmd !== null ? (
                        <span className={`font-bold tabular-nums ${g.gmd >= 0.8 ? 'text-emerald-400' : g.gmd >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {g.gmd} kg/dia
                        </span>
                      ) : <span className="text-gray-600">—</span>}
                    </TableCell>
                    <TableCell className="tabular-nums">{g.pesagens}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Curva de Crescimento */}
      {curvasCrescimento.some(c => c.pontos.length >= 2) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Scale size={18} className="text-blue-400" /> Curva de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart curvas={curvasCrescimento.filter(c => c.pontos.length >= 2)} />
          </CardContent>
        </Card>
      )}

      {/* Lotação dos Piquetes */}
      {lotacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 size={18} className="text-teal-400" /> Lotação dos Piquetes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lotacao.map(p => (
                <div key={p.nome} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{p.nome}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-white font-bold tabular-nums">{p.animais} animais</span>
                      {p.area_hectares && <span className="text-gray-600">{p.area_hectares} ha</span>}
                      {p.capacidade_ua && (
                        <Badge variant={p.animais > p.capacidade_ua ? 'destructive' : 'default'}>
                          {p.animais}/{p.capacidade_ua} UA
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${p.capacidade_ua && p.animais > p.capacidade_ua ? 'bg-red-500' : 'bg-gradient-to-r from-teal-400 to-emerald-500'}`}
                      style={{ width: p.capacidade_ua ? `${Math.min((p.animais / p.capacidade_ua) * 100, 100)}%` : '50%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
