import { useEffect, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { numero: '', nome: '', data_nascimento: '', raca: '', observacoes: '' }

export default function Matrizes() {
  const [matrizes, setMatrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.matrizes.list().then(setMatrizes).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = matrizes.filter(m =>
    m.numero.toLowerCase().includes(search.toLowerCase()) ||
    (m.nome || '').toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (m) => { setEditing(m); setForm({ numero: m.numero, nome: m.nome || '', data_nascimento: m.data_nascimento || '', raca: m.raca || '', status: m.status, observacoes: m.observacoes || '' }); setModalOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.matrizes.update(editing.id, form)
        toast.success('Matriz atualizada')
      } else {
        await api.matrizes.create(form)
        toast.success('Matriz cadastrada')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (m) => {
    if (!confirm(`Excluir matriz #${m.numero}?`)) return
    try {
      await api.matrizes.delete(m.id)
      toast.success('Matriz excluída')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Matrizes (Vacas)</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nova Matriz
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número ou nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Nenhuma matriz cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Matriz" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Raça</th>
                  <th className="px-4 py-3 font-medium">Nascimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">#{m.numero}</td>
                    <td className="px-4 py-3 text-gray-600">{m.nome || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.raca || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.data_nascimento || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge value={m.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(m)} className="text-blue-500 hover:text-blue-700"><Pencil size={16} /></button>
                        <button onClick={() => remove(m)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Matriz' : 'Nova Matriz'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número / Brinco *</label>
            <input required value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome (apelido)</label>
            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
              <input value={form.raca} onChange={e => setForm({ ...form, raca: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
              <input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="ativa">Ativa</option>
                <option value="descartada">Descartada</option>
                <option value="morta">Morta</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
              {editing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
