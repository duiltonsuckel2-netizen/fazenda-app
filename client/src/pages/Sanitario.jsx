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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = { animal_tipo: 'matriz', animal_id: '', tipo: 'vacina', nome: '', data: '', proxima_data: '', dose: '', carencia_dias: '', veterinario: '', custo: '', observacoes: '' }

export default function Sanitario() {
  const [registros, setRegistros] = useState([])
  const [vencimentos, setVencimentos] = useState([])
  const [matrizes, setMatrizes] = useState([])
  const [bezerros, setBezerros] = useState([])
  const [touros, setTouros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => Promise.all([
    api.sanitario.list(filterTipo ? { tipo: filterTipo } : undefined).then(setRegistros),
    api.sanitario.vencimentos().then(setVencimentos),
    api.matrizes.list().then(setMatrizes),
    api.bezerros.list().then(setBezerros),
    api.touros.list().then(setTouros),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [filterTipo])

  const filtered = registros.filter(r =>
    (r.animal_numero || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.veterinario || '').toLowerCase().includes(search.toLowerCase())
  )

  const getAnimais = (tipo) => {
    if (tipo === 'matriz') return matrizes.map(m => ({ id: m.id, label: `#${m.numero}${m.nome ? ` - ${m.nome}` : ''}` }))
    if (tipo === 'bezerro') return bezerros.map(b => ({ id: b.id, label: `#${b.numero}` }))
    if (tipo === 'touro') return touros.map(t => ({ id: t.id, label: `#${t.numero}${t.nome ? ` - ${t.nome}` : ''}` }))
    return []
  }

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, data: new Date().toISOString().split('T')[0] }); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setForm({
      animal_tipo: r.animal_tipo, animal_id: r.animal_id, tipo: r.tipo, nome: r.nome,
      data: r.data, proxima_data: r.proxima_data || '', dose: r.dose || '',
      carencia_dias: r.carencia_dias || '', veterinario: r.veterinario || '',
      custo: r.custo || '', observacoes: r.observacoes || ''
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.sanitario.update(editing.id, form)
        toast.success('Registro atualizado')
      } else {
        await api.sanitario.create(form)
        toast.success('Registro sanitário criado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.sanitario.delete(deleteTarget.id)
      toast.success('Registro excluído')
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
          <h1 className="text-2xl font-bold page-title">Controle Sanitário</h1>
          <p className="text-sm text-gray-500 mt-0.5">{registros.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Novo Registro</Button>
      </div>

      {/* Próximos vencimentos */}
      {vencimentos.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle size={16} /> Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vencimentos.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 bg-white/[0.03] rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={v.animal_tipo} />
                    <span className="text-white font-medium">#{v.animal_numero}</span>
                    <span className="text-gray-400">— {v.nome}</span>
                  </div>
                  <span className="text-amber-400 tabular-nums font-medium">{v.proxima_data}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar por animal, nome ou veterinário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="sm:w-48">
          <option value="">Todos os tipos</option>
          <option value="vacina">Vacinas</option>
          <option value="vermifugo">Vermífugos</option>
          <option value="tratamento">Tratamentos</option>
          <option value="exame">Exames</option>
        </Select>
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">&#x1FA7A;</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum registro sanitário</p>
            <p className="text-sm text-gray-400 mt-1">Registre vacinas, vermífugos e tratamentos</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Animal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Próx. Dose</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={r.animal_tipo} />
                      <span className="font-semibold text-white">#{r.animal_numero}</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge value={r.tipo} /></TableCell>
                  <TableCell className="text-white">{r.nome}</TableCell>
                  <TableCell className="tabular-nums">{r.data}</TableCell>
                  <TableCell>
                    {r.proxima_data ? (
                      <span className={`tabular-nums ${new Date(r.proxima_data) < new Date() ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                        {r.proxima_data}
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.custo ? `R$ ${Number(r.custo).toFixed(2)}` : <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(r)}><Pencil size={14} /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(r)} className="text-red-400 focus:text-red-300 focus:bg-red-500/15"><Trash2 size={14} /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Registro' : 'Novo Registro Sanitário'}</DialogTitle>
            <DialogDescription>Registre vacinas, vermífugos, tratamentos ou exames.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Animal *</Label>
                <Select value={form.animal_tipo} onChange={e => setForm({ ...form, animal_tipo: e.target.value, animal_id: '' })}>
                  <option value="matriz">Matriz</option>
                  <option value="bezerro">Bezerro</option>
                  <option value="touro">Touro</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Select required value={form.animal_id} onChange={e => setForm({ ...form, animal_id: Number(e.target.value) })}>
                  <option value="">Selecione...</option>
                  {getAnimais(form.animal_tipo).map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="vacina">Vacina</option>
                  <option value="vermifugo">Vermífugo</option>
                  <option value="tratamento">Tratamento</option>
                  <option value="exame">Exame</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome / Produto *</Label>
                <Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Aftosa, Ivermectina..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Próxima Dose</Label>
                <Input type="date" value={form.proxima_data} onChange={e => setForm({ ...form, proxima_data: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} placeholder="Ex: 5ml" />
              </div>
              <div className="space-y-2">
                <Label>Carência (dias)</Label>
                <Input type="number" value={form.carencia_dias} onChange={e => setForm({ ...form, carencia_dias: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Custo (R$)</Label>
                <Input type="number" step="0.01" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veterinário</Label>
              <Input value={form.veterinario} onChange={e => setForm({ ...form, veterinario: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? 'Salvar' : 'Registrar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro sanitário?</AlertDialogTitle>
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
