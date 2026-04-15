import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import { Beef, Baby, Syringe, DollarSign, TrendingUp, MapPin } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
  if (!stats) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Beef} label="Matrizes Ativas" value={stats.totalMatrizes} color="bg-green-600" sub={`${stats.matrizesPrenas} prenhas`} />
        <StatCard icon={Baby} label="Bezerros Total" value={stats.totalBezerros} color="bg-blue-600" sub={`${stats.bezerrosMachos}M / ${stats.bezerrosFemeas}F`} />
        <StatCard icon={TrendingUp} label="Taxa de Sucesso" value={`${stats.taxaSucesso}%`} color="bg-amber-500" sub={`${stats.totalInseminacoes} inseminações`} />
        <StatCard icon={DollarSign} label="Total Vendas" value={`R$ ${stats.valorTotalVendas.toLocaleString('pt-BR')}`} color="bg-emerald-600" sub={`${stats.bezerrosVendidos} vendidos`} />
      </div>

      {/* Destinos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={20} /> Destino dos Bezerros
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Na Fazenda', value: stats.bezerrosNaFazenda, color: 'bg-blue-500' },
              { label: 'Vendidos (Desmame)', value: stats.bezerrosVendidos, color: 'bg-amber-500' },
              { label: 'Escalada', value: stats.bezerrosEscalada, color: 'bg-purple-500' },
              { label: 'Frigorífico', value: stats.bezerrosFrigorifico, color: 'bg-orange-500' },
              { label: 'IPÊ', value: stats.bezerrosIpe, color: 'bg-teal-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Syringe size={20} /> Inseminações Pendentes
          </h2>
          {stats.inseminacoesPendentes.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma inseminação pendente</p>
          ) : (
            <div className="space-y-2">
              {stats.inseminacoesPendentes.map(ins => (
                <div key={ins.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">#{ins.matriz_numero}</span>
                    {ins.matriz_nome && <span className="text-gray-400 text-sm ml-1">({ins.matriz_nome})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={ins.tipo} />
                    <span className="text-xs text-gray-400">{ins.data}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos nascimentos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Baby size={20} /> Últimos Nascimentos
        </h2>
        {stats.ultimosNascimentos.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum bezerro cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Bezerro</th>
                  <th className="pb-2 font-medium">Mãe</th>
                  <th className="pb-2 font-medium">Nascimento</th>
                  <th className="pb-2 font-medium">Sexo</th>
                  <th className="pb-2 font-medium">Peso</th>
                  <th className="pb-2 font-medium">Destino</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosNascimentos.map(b => (
                  <tr key={b.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-800">#{b.numero}</td>
                    <td className="py-2 text-gray-600">#{b.matriz_numero} {b.matriz_nome && `(${b.matriz_nome})`}</td>
                    <td className="py-2 text-gray-600">{b.data_nascimento}</td>
                    <td className="py-2"><StatusBadge value={b.sexo} /></td>
                    <td className="py-2 text-gray-600">{b.peso_atual ? `${b.peso_atual} kg` : '-'}</td>
                    <td className="py-2"><StatusBadge value={b.destino} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
