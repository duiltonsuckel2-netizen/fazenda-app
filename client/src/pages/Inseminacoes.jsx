import { useEffect, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { matriz_id: '', data: '', tipo: 'IA', touro_semen: '', observacoes: '' }

export default function Inseminacoes() {
  const [inseminacoes, setInseminacoes] = useState([])
  const [matrizes, setMatrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => Promise.all([
    api.inseminacoes.list().then(setInseminacoes),
    api.matrizes.list().then(setMatrizes),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (ins) => {
    setEditing(ins)
    setForm({
      matriz_id: ins.matriz_id, data: ins.data, tipo: ins.tipo,
      touro_semen: ins.touro_semen || '', resultado: ins.resultado,
      data_resultado: ins.data_resultado || '', observacoes: ins.observacoes || ''
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.inseminacoes.update(editing.id, form)
        toast.success('Inseminação atualizada')
      } else {
        await api.inseminacoes.create(form)
        toast.success('Inseminação registrada')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const setResultado = async (ins, resultado) => {
    try {
      await api.inseminacoes.update(ins.id, { ...ins, resultado, data_resultado: new Date().toISOString().split('T')[0] })
      toast.success(resultado === 'prenha' ? 'Marcada como prenha!' : 'Marcada como vazia')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (ins) => {
    if (!confirm('Excluir inseminação?')) return
    try {
      await api.inseminacoes.delete(ins.id)
      toast.success('Inseminação excluída')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inseminações</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nova Inseminação
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : inseminacoes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Nenhuma inseminação registrada</p>
          <p className="text-sm mt-1">Cadastre matrizes primeiro, depois registre inseminações</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Matriz</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Touro/Sêmen</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inseminacoes.map(ins => (
                  <tr key={ins.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      #{ins.matriz_numero} {ins.matriz_nome && <span className="text-gray-400">({ins.matriz_nome})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ins.data}</td>
                    <td className="px-4 py-3"><StatusBadge value={ins.tipo} /></td>
                    <td className="px-4 py-3 text-gray-600">{ins.touro_semen || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge value={ins.resultado} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {ins.resultado === 'pendente' && (
                          <>
                            <button onClick={() => setResultado(ins, 'prenha')} title="Prenha" className="text-green-500 hover:text-green-700"><CheckCircle size={16} /></button>
                            <button onClick={() => setResultado(ins, 'vazia')} title="Vazia" className="text-red-400 hover:text-red-600"><XCircle size={16} /></button>
                          </>
                        )}
                        <button onClick={() => openEdit(ins)} className="text-blue-500 hover:text-blue-700"><Pencil size={16} /></button>
                        <button onClick={() => remove(ins)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Inseminação' : 'Nova Inseminação'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matriz *</label>
            <select required value={form.matriz_id} onChange={e => setForm({ ...form, matriz_id: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Selecione a matriz...</option>
              {matrizes.filter(m => m.status === 'ativa').map(m => (
                <option key={m.id} value={m.id}>#{m.numero} {m.nome ? `- ${m.nome}` : ''}</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="IA">Inseminação Artificial</option>
                <option value="MN">Monta Natural (Touro)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Touro / Sêmen</label>
            <input value={form.touro_semen} onChange={e => setForm({ ...form, touro_semen: e.target.value })}
              placeholder="Nome do touro ou código do sêmen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                <select value={form.resultado} onChange={e => setForm({ ...form, resultado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="pendente">Pendente</option>
                  <option value="prenha">Prenha</option>
                  <option value="vazia">Vazia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Resultado</label>
                <input type="date" value={form.data_resultado} onChange={e => setForm({ ...form, data_resultado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
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
              {editing ? 'Salvar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
