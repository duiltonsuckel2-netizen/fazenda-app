import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Beef, Baby, Syringe, DollarSign, TrendingUp, MapPin, CircleDot, Scale } from 'lucide-react'

function StatCard({ icon: Icon, label, value, gradient, glow, sub, delay }) {
  return (
    <div className={`animate-in animate-in-delay-${delay}`}>
      <Card className="group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${glow}`}>
              <Icon size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-3xl font-bold text-white mt-0.5 tracking-tight">{value}</p>
              {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!stats) return null

  const totalDestinos = stats.bezerrosNaFazenda + stats.bezerrosVendidos + stats.bezerrosEscalada + stats.bezerrosFrigorifico + stats.bezerrosIpe

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Beef} label="Matrizes Ativas" value={stats.totalMatrizes} gradient="from-emerald-400 to-green-600" glow="shadow-emerald-500/25" sub={`${stats.matrizesPrenas} prenhas`} delay={1} />
        <StatCard icon={CircleDot} label="Touros Ativos" value={stats.totalTouros || 0} gradient="from-purple-400 to-purple-600" glow="shadow-purple-500/25" delay={2} />
        <StatCard icon={Baby} label="Bezerros Total" value={stats.totalBezerros} gradient="from-blue-400 to-blue-600" glow="shadow-blue-500/25" sub={`${stats.bezerrosMachos}M / ${stats.bezerrosFemeas}F`} delay={3} />
        <StatCard icon={TrendingUp} label="Taxa de Sucesso" value={`${stats.taxaSucesso}%`} gradient="from-amber-400 to-orange-500" glow="shadow-amber-500/25" sub={`${stats.totalInseminacoes} inseminações`} delay={4} />
      </div>

      {/* Segunda fileira: Vendas + Peso médio saída */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Total Vendas" value={`R$ ${stats.valorTotalVendas.toLocaleString('pt-BR')}`} gradient="from-violet-400 to-purple-600" glow="shadow-violet-500/25" sub={`${stats.bezerrosVendidos + stats.bezerrosFrigorifico} vendidos`} delay={1} />
        <Card className="animate-in animate-in-delay-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-600 shadow-lg shadow-blue-500/25">
                <Scale size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Peso Médio Saída (Machos)</p>
                <p className="text-3xl font-bold text-blue-400 mt-0.5 tracking-tight">
                  {stats.pesoSaidaMachos ? `${stats.pesoSaidaMachos} kg` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-in animate-in-delay-3">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg shadow-pink-500/25">
                <Scale size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Peso Médio Saída (Fêmeas)</p>
                <p className="text-3xl font-bold text-pink-400 mt-0.5 tracking-tight">
                  {stats.pesoSaidaFemeas ? `${stats.pesoSaidaFemeas} kg` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destinos + Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-in animate-in-delay-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-400" /> Destino dos Bezerros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Na Fazenda', value: stats.bezerrosNaFazenda, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-500' },
                { label: 'Vendidos (Desmame)', value: stats.bezerrosVendidos, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-500' },
                { label: 'Escalada', value: stats.bezerrosEscalada, color: 'from-purple-400 to-purple-600', bg: 'bg-purple-500' },
                { label: 'Frigorífico', value: stats.bezerrosFrigorifico, color: 'from-orange-400 to-orange-600', bg: 'bg-orange-500' },
                { label: 'IPÊ', value: stats.bezerrosIpe, color: 'from-teal-400 to-teal-600', bg: 'bg-teal-500' },
              ].map(item => (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.bg} ring-2 ring-offset-2 ring-offset-[#0f1117] ring-transparent group-hover:ring-white/10 transition-all`} />
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{item.label}</span>
                    </div>
                    <span className="font-bold text-white tabular-nums">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: totalDestinos > 0 ? `${(item.value / totalDestinos) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in animate-in-delay-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe size={18} className="text-amber-400" /> Inseminações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.inseminacoesPendentes.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center">Nenhuma inseminação pendente</p>
            ) : (
              <div className="space-y-2">
                {stats.inseminacoesPendentes.map(ins => (
                  <div key={ins.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all duration-200">
                    <div>
                      <span className="font-medium text-white">#{ins.matriz_numero}</span>
                      {ins.matriz_nome && <span className="text-gray-500 text-sm ml-1.5">({ins.matriz_nome})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={ins.tipo} />
                      <span className="text-xs text-gray-600 tabular-nums">{ins.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos nascimentos */}
      <Card className="animate-in animate-in-delay-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby size={18} className="text-blue-400" /> Últimos Nascimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.ultimosNascimentos.length === 0 ? (
            <p className="text-gray-600 text-sm py-4 text-center">Nenhum bezerro cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/[0.06]">
                  <TableHead>Bezerro</TableHead>
                  <TableHead>Mãe</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.ultimosNascimentos.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-white">#{b.numero}</TableCell>
                    <TableCell>#{b.matriz_numero} {b.matriz_nome && `(${b.matriz_nome})`}</TableCell>
                    <TableCell className="tabular-nums">{b.data_nascimento}</TableCell>
                    <TableCell><StatusBadge value={b.sexo} /></TableCell>
                    <TableCell className="tabular-nums">{b.peso_atual ? `${b.peso_atual} kg` : '-'}</TableCell>
                    <TableCell><StatusBadge value={b.destino} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
