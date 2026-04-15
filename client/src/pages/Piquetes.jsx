import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'

const emptyPiquete = { nome: '', area_hectares: '', tipo_pastagem: '', capacidade_ua: '', observacoes: '' }
const emptyAlocacao = { animal_tipo: 'bezerro', animal_id: '', data_entrada: '' }

export default function Piquetes() {
  const [piquetes, setPiquetes] = useState([])
  const [matrizes, setMatrizes] = useState([])
  const [bezerros, setBezerros] = useState([])
  const [touros, setTouros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [alocModalOpen, setAlocModalOpen] = useState(false)
  const [alocTarget, setAlocTarget] = useState(null)
  const [alocacoes, setAlocacoes] = useState([])
  const [detailPiquete, setDetailPiquete] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyPiquete)
  const [alocForm, setAlocForm] = useState(emptyAlocacao)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => Promise.all([
    api.piquetes.list().then(setPiquetes),
    api.matrizes.list().then(setMatrizes),
    api.bezerros.list().then(setBezerros),
    api.touros.list().then(setTouros),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(emptyPiquete); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ nome: p.nome, area_hectares: p.area_hectares || '', tipo_pastagem: p.tipo_pastagem || '', capacidade_ua: p.capacidade_ua || '', status: p.status, observacoes: p.observacoes || '' })
    setModalOpen(true)
  }

  const openAlocar = (p) => {
    setAlocTarget(p)
    setAlocForm({ ...emptyAlocacao, data_entrada: new Date().toISOString().split('T')[0] })
    setAlocModalOpen(true)
  }

  const openDetail = async (p) => {
    setDetailPiquete(p)
    const alocs = await api.piquetes.alocacoes(p.id)
    setAlocacoes(alocs)
  }

  const getAnimais = (tipo) => {
    if (tipo === 'matriz') return matrizes.map(m => ({ id: m.id, label: `#${m.numero}${m.nome ? ` - ${m.nome}` : ''}` }))
    if (tipo === 'bezerro') return bezerros.map(b => ({ id: b.id, label: `#${b.numero}` }))
    if (tipo === 'touro') return touros.map(t => ({ id: t.id, label: `#${t.numero}${t.nome ? ` - ${t.nome}` : ''}` }))
    return []
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.piquetes.update(editing.id, form)
        toast.success('Piquete atualizado')
      } else {
        await api.piquetes.create(form)
        toast.success('Piquete cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveAlocacao = async (e) => {
    e.preventDefault()
    try {
      await api.piquetes.alocar(alocTarget.id, alocForm)
      toast.success('Animal alocado no piquete')
      setAlocModalOpen(false)
      load()
      if (detailPiquete?.id === alocTarget.id) openDetail(alocTarget)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const desalocar = async (alocId) => {
    try {
      await api.piquetes.desalocar(alocId, { data_saida: new Date().toISOString().split('T')[0] })
      toast.success('Animal removido do piquete')
      load()
      if (detailPiquete) openDetail(detailPiquete)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.piquetes.delete(deleteTarget.id)
      toast.success('Piquete excluído')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Piquetes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{piquetes.length} piquetes</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Novo Piquete</Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</CardContent></Card>
      ) : piquetes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">&#x1F33F;</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum piquete cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {piquetes.map(p => (
            <Card key={p.id} className="hover:border-white/10 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{p.nome}</CardTitle>
                  <div className="flex items-center gap-1">
                    <StatusBadge value={p.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAlocar(p)}><LogIn size={14} /> Alocar Animal</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDetail(p)}><LogOut size={14} /> Ver Alocações</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEdit(p)}><Pencil size={14} /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 size={14} /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Área</span>
                    <p className="text-white font-medium">{p.area_hectares ? `${p.area_hectares} ha` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pastagem</span>
                    <p className="text-white font-medium">{p.tipo_pastagem || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacidade</span>
                    <p className="text-white font-medium">{p.capacidade_ua ? `${p.capacidade_ua} UA` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Animais</span>
                    <p className="text-emerald-400 font-bold text-lg">{p.animais_alocados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Piquete */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Piquete' : 'Novo Piquete'}</DialogTitle>
            <DialogDescription>Cadastre as informações do piquete.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Piquete 1, Mangueira..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área (hectares)</Label>
                <Input type="number" step="0.1" value={form.area_hectares} onChange={e => setForm({ ...form, area_hectares: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (UA)</Label>
                <Input type="number" step="0.1" value={form.capacidade_ua} onChange={e => setForm({ ...form, capacidade_ua: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Pastagem</Label>
              <Input value={form.tipo_pastagem} onChange={e => setForm({ ...form, tipo_pastagem: e.target.value })} placeholder="Ex: Brachiaria, Mombaça..." />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="ativo">Ativo</option>
                  <option value="em_descanso">Em Descanso</option>
                  <option value="em_reforma">Em Reforma</option>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Alocar */}
      <Dialog open={alocModalOpen} onOpenChange={setAlocModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alocar Animal — {alocTarget?.nome}</DialogTitle>
            <DialogDescription>Adicione um animal a este piquete.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAlocacao} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Animal *</Label>
                <Select value={alocForm.animal_tipo} onChange={e => setAlocForm({ ...alocForm, animal_tipo: e.target.value, animal_id: '' })}>
                  <option value="matriz">Matriz</option>
                  <option value="bezerro">Bezerro</option>
                  <option value="touro">Touro</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Select required value={alocForm.animal_id} onChange={e => setAlocForm({ ...alocForm, animal_id: Number(e.target.value) })}>
                  <option value="">Selecione...</option>
                  {getAnimais(alocForm.animal_tipo).map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Entrada *</Label>
              <Input type="date" required value={alocForm.data_entrada} onChange={e => setAlocForm({ ...alocForm, data_entrada: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAlocModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Alocar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Alocações (detalhe) */}
      <Dialog open={!!detailPiquete} onOpenChange={(open) => !open && setDetailPiquete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alocações — {detailPiquete?.nome}</DialogTitle>
            <DialogDescription>Animais alocados neste piquete.</DialogDescription>
          </DialogHeader>
          {alocacoes.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Nenhum animal alocado</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alocacoes.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={a.animal_tipo} />
                    <span className="text-white font-medium">#{a.animal_numero}</span>
                    {a.animal_nome && <span className="text-gray-500 text-sm">({a.animal_nome})</span>}
                    <span className="text-gray-600 text-xs ml-2">{a.data_entrada}</span>
                  </div>
                  {a.data_saida ? (
                    <Badge variant="secondary">Saiu {a.data_saida}</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => desalocar(a.id)}>
                      <LogOut size={14} /> Remover
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir piquete {deleteTarget?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
