import { useEffect, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { numero: '', matriz_id: '', data_nascimento: '', sexo: 'M', tipo_concepcao: 'IA', peso_nascimento: '', observacoes: '' }

export default function Bezerros() {
  const [bezerros, setBezerros] = useState([])
  const [matrizes, setMatrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDestino, setFilterDestino] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [destinoModal, setDestinoModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [destinoForm, setDestinoForm] = useState({ destino: '', data_destino: '', valor_venda: '', comprador: '' })

  const load = () => Promise.all([
    api.bezerros.list(filterDestino ? { destino: filterDestino } : undefined).then(setBezerros),
    api.matrizes.list().then(setMatrizes),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [filterDestino])

  const filtered = bezerros.filter(b =>
    b.numero.toLowerCase().includes(search.toLowerCase()) ||
    (b.matriz_numero || '').toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (b) => {
    setEditing(b)
    setForm({
      numero: b.numero, matriz_id: b.matriz_id, data_nascimento: b.data_nascimento,
      sexo: b.sexo, tipo_concepcao: b.tipo_concepcao, peso_nascimento: b.peso_nascimento || '',
      peso_desmame: b.peso_desmame || '', peso_atual: b.peso_atual || '', observacoes: b.observacoes || '',
      destino: b.destino, data_destino: b.data_destino || '', valor_venda: b.valor_venda || '', comprador: b.comprador || ''
    })
    setModalOpen(true)
  }

  const openDestino = (b) => {
    setDestinoModal(b)
    setDestinoForm({ destino: '', data_destino: new Date().toISOString().split('T')[0], valor_venda: '', comprador: '' })
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.bezerros.update(editing.id, form)
        toast.success('Bezerro atualizado')
      } else {
        await api.bezerros.create(form)
        toast.success('Bezerro cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveDestino = async (e) => {
    e.preventDefault()
    try {
      await api.bezerros.updateDestino(destinoModal.id, destinoForm)
      toast.success('Destino atualizado')
      setDestinoModal(null)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (b) => {
    if (!confirm(`Excluir bezerro #${b.numero}?`)) return
    try {
      await api.bezerros.delete(b.id)
      toast.success('Bezerro excluído')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bezerros</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Novo Bezerro
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por número ou mãe..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <select value={filterDestino} onChange={e => setFilterDestino(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os destinos</option>
          <option value="na_fazenda">Na Fazenda</option>
          <option value="vendido_desmame">Vendido (Desmame)</option>
          <option value="escalada">Escalada</option>
          <option value="frigorifico">Frigorífico</option>
          <option value="ipe">IPÊ</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Nenhum bezerro encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Mãe</th>
                  <th className="px-4 py-3 font-medium">Nascimento</th>
                  <th className="px-4 py-3 font-medium">Sexo</th>
                  <th className="px-4 py-3 font-medium">Concepção</th>
                  <th className="px-4 py-3 font-medium">Peso Atual</th>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">#{b.numero}</td>
                    <td className="px-4 py-3 text-gray-600">#{b.matriz_numero} {b.matriz_nome && `(${b.matriz_nome})`}</td>
                    <td className="px-4 py-3 text-gray-600">{b.data_nascimento}</td>
                    <td className="px-4 py-3"><StatusBadge value={b.sexo} /></td>
                    <td className="px-4 py-3"><StatusBadge value={b.tipo_concepcao} /></td>
                    <td className="px-4 py-3 text-gray-600">{b.peso_atual ? `${b.peso_atual} kg` : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge value={b.destino} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openDestino(b)} title="Definir destino" className="text-purple-500 hover:text-purple-700"><MapPin size={16} /></button>
                        <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-700"><Pencil size={16} /></button>
                        <button onClick={() => remove(b)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal cadastro/edição */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Bezerro' : 'Novo Bezerro'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número / Brinco *</label>
              <input required value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mãe (Matriz) *</label>
              <select required value={form.matriz_id} onChange={e => setForm({ ...form, matriz_id: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Selecione...</option>
                {matrizes.map(m => (
                  <option key={m.id} value={m.id}>#{m.numero} {m.nome ? `- ${m.nome}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nascimento *</label>
              <input type="date" required value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepção *</label>
              <select value={form.tipo_concepcao} onChange={e => setForm({ ...form, tipo_concepcao: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="IA">Inseminação Artificial</option>
                <option value="MN">Monta Natural</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso ao Nascer (kg)</label>
            <input type="number" step="0.1" value={form.peso_nascimento} onChange={e => setForm({ ...form, peso_nascimento: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {editing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso Desmame (kg)</label>
                  <input type="number" step="0.1" value={form.peso_desmame} onChange={e => setForm({ ...form, peso_desmame: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso Atual (kg)</label>
                  <input type="number" step="0.1" value={form.peso_atual} onChange={e => setForm({ ...form, peso_atual: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                  <select value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="na_fazenda">Na Fazenda</option>
                    <option value="vendido_desmame">Vendido (Desmame)</option>
                    <option value="escalada">Escalada</option>
                    <option value="frigorifico">Frigorífico</option>
                    <option value="ipe">IPÊ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Destino</label>
                  <input type="date" value={form.data_destino} onChange={e => setForm({ ...form, data_destino: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              {(form.destino === 'vendido_desmame' || form.destino === 'frigorifico') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Venda (R$)</label>
                    <input type="number" step="0.01" value={form.valor_venda} onChange={e => setForm({ ...form, valor_venda: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comprador</label>
                    <input value={form.comprador} onChange={e => setForm({ ...form, comprador: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              )}
            </>
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

      {/* Modal destino rápido */}
      <Modal open={!!destinoModal} onClose={() => setDestinoModal(null)} title={`Definir Destino - #${destinoModal?.numero}`}>
        <form onSubmit={saveDestino} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p><strong>Fluxo do bezerro:</strong></p>
            <p className="mt-2">Na Fazenda → <strong>Vendido no Desmame</strong> ou <strong>Escalada</strong></p>
            <p>Escalada → <strong>Frigorífico</strong> (bateu peso) ou <strong>IPÊ</strong> (não bateu)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Novo Destino *</label>
            <select required value={destinoForm.destino} onChange={e => setDestinoForm({ ...destinoForm, destino: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Selecione...</option>
              <option value="vendido_desmame">Vendido no Desmame</option>
              <option value="escalada">Enviado para Escalada</option>
              <option value="frigorifico">Frigorífico (bateu peso)</option>
              <option value="ipe">IPÊ (não bateu peso)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input type="date" value={destinoForm.data_destino} onChange={e => setDestinoForm({ ...destinoForm, data_destino: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {(destinoForm.destino === 'vendido_desmame' || destinoForm.destino === 'frigorifico') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Venda (R$)</label>
                <input type="number" step="0.01" value={destinoForm.valor_venda} onChange={e => setDestinoForm({ ...destinoForm, valor_venda: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprador</label>
                <input value={destinoForm.comprador} onChange={e => setDestinoForm({ ...destinoForm, comprador: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDestinoModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Confirmar Destino</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
