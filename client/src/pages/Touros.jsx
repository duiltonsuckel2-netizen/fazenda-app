import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = { numero: '', nome: '', raca: '', data_nascimento: '', origem: '', observacoes: '' }

export default function Touros() {
  const [touros, setTouros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => api.touros.list().then(setTouros).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = touros.filter(t =>
    t.numero.toLowerCase().includes(search.toLowerCase()) ||
    (t.nome || '').toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({ numero: t.numero, nome: t.nome || '', raca: t.raca || '', data_nascimento: t.data_nascimento || '', origem: t.origem || '', status: t.status, observacoes: t.observacoes || '' })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.touros.update(editing.id, form)
        toast.success('Touro atualizado')
      } else {
        await api.touros.create(form)
        toast.success('Touro cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.touros.delete(deleteTarget.id)
      toast.success('Touro excluído')
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
          <h1 className="text-2xl font-bold page-title">Touros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{touros.length} registros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo Touro
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Buscar por número ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">&#x1F402;</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum touro cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Novo Touro" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Número</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Raça</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold text-white">#{t.numero}</TableCell>
                  <TableCell>{t.nome || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>{t.raca || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell className="tabular-nums">{t.data_nascimento || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>{t.origem || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell><StatusBadge value={t.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil size={14} /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-red-400 focus:text-red-300 focus:bg-red-500/15"><Trash2 size={14} /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Touro' : 'Novo Touro'}</DialogTitle>
            <DialogDescription>{editing ? 'Atualize os dados do touro.' : 'Cadastre um novo touro.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número / Brinco *</Label>
                <Input required value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raça</Label>
                <Input value={form.raca} onChange={e => setForm({ ...form, raca: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Input value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })} placeholder="Ex: Comprado de Fazenda XYZ" />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="ativo">Ativo</option>
                  <option value="descartado">Descartado</option>
                  <option value="morto">Morto</option>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir touro #{deleteTarget?.numero}?</AlertDialogTitle>
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
