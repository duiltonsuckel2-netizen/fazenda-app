import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Beef, Baby, Syringe, DollarSign, TrendingUp, MapPin } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${color} shadow-sm`}>
            <Icon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
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
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-8 w-full" />)}
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

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Beef} label="Matrizes Ativas" value={stats.totalMatrizes} color="bg-green-600" sub={`${stats.matrizesPrenas} prenhas`} />
        <StatCard icon={Baby} label="Bezerros Total" value={stats.totalBezerros} color="bg-blue-600" sub={`${stats.bezerrosMachos}M / ${stats.bezerrosFemeas}F`} />
        <StatCard icon={TrendingUp} label="Taxa de Sucesso" value={`${stats.taxaSucesso}%`} color="bg-amber-500" sub={`${stats.totalInseminacoes} inseminações`} />
        <StatCard icon={DollarSign} label="Total Vendas" value={`R$ ${stats.valorTotalVendas.toLocaleString('pt-BR')}`} color="bg-emerald-600" sub={`${stats.bezerrosVendidos} vendidos`} />
      </div>

      {/* Destinos + Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-400" /> Destino dos Bezerros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Na Fazenda', value: stats.bezerrosNaFazenda, color: 'bg-blue-500' },
                { label: 'Vendidos (Desmame)', value: stats.bezerrosVendidos, color: 'bg-amber-500' },
                { label: 'Escalada', value: stats.bezerrosEscalada, color: 'bg-purple-500' },
                { label: 'Frigorífico', value: stats.bezerrosFrigorifico, color: 'bg-orange-500' },
                { label: 'IPÊ', value: stats.bezerrosIpe, color: 'bg-teal-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} ring-2 ring-offset-2 ring-transparent group-hover:ring-gray-200 transition-all`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-800 tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe size={18} className="text-gray-400" /> Inseminações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.inseminacoesPendentes.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">Nenhuma inseminação pendente</p>
            ) : (
              <div className="space-y-2">
                {stats.inseminacoesPendentes.map(ins => (
                  <div key={ins.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <span className="font-medium text-gray-700">#{ins.matriz_numero}</span>
                      {ins.matriz_nome && <span className="text-gray-400 text-sm ml-1.5">({ins.matriz_nome})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={ins.tipo} />
                      <span className="text-xs text-gray-400 tabular-nums">{ins.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos nascimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby size={18} className="text-gray-400" /> Últimos Nascimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.ultimosNascimentos.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Nenhum bezerro cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
                    <TableCell className="font-medium text-gray-900">#{b.numero}</TableCell>
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
