import { useEffect, useState } from 'react'
import { api } from '../api'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

export default function Pesagens() {
  const [pesagens, setPesagens] = useState([])
  const [bezerros, setBezerros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ bezerro_id: '', data: '', peso: '', observacoes: '' })

  const load = () => Promise.all([
    api.pesagens.list().then(setPesagens),
    api.bezerros.list().then(setBezerros),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm({ bezerro_id: '', data: new Date().toISOString().split('T')[0], peso: '', observacoes: '' })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      await api.pesagens.create({ ...form, bezerro_id: Number(form.bezerro_id), peso: Number(form.peso) })
      toast.success('Pesagem registrada! Peso atual do bezerro atualizado.')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (p) => {
    if (!confirm('Excluir pesagem?')) return
    try {
      await api.pesagens.delete(p.id)
      toast.success('Pesagem excluída')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pesagens</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nova Pesagem
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : pesagens.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Nenhuma pesagem registrada</p>
          <p className="text-sm mt-1">Cadastre bezerros e registre suas pesagens</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Bezerro</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Peso (kg)</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pesagens.map(p => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">#{p.bezerro_numero}</td>
                    <td className="px-4 py-3 text-gray-600">{p.data}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{p.peso} kg</td>
                    <td className="px-4 py-3 text-gray-500">{p.observacoes || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(p)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Pesagem">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bezerro *</label>
            <select required value={form.bezerro_id} onChange={e => setForm({ ...form, bezerro_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Selecione o bezerro...</option>
              {bezerros.map(b => (
                <option key={b.id} value={b.id}>#{b.numero} - Mãe: #{b.matriz_numero}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg) *</label>
              <input type="number" step="0.1" required value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Registrar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
