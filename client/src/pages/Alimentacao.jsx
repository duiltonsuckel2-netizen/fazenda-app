import { useEffect, useState } from 'react'
import { api } from '../api'
import { Badge } from '@/components/ui/badge'
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

const emptyForm = { bezerro_id: '', tipo: 'sal', sal_nome: '', sal_marca: '', sal_preco: '', data_inicio: '', data_fim: '', observacoes: '' }

export default function Alimentacao() {
  const [registros, setRegistros] = useState([])
  const [bezerros, setBezerros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [resumo, setResumo] = useState({ totalSal: 0, qtdSal: 0, qtdRacao: 0 })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => Promise.all([
    api.alimentacao.list().then(setRegistros),
    api.bezerros.list().then(setBezerros),
    api.alimentacao.resumo().then(setResumo),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const filtered = registros.filter(r =>
    (r.bezerro_numero || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.sal_nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.sal_marca || '').toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, data_inicio: new Date().toISOString().split('T')[0] }); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setForm({
      bezerro_id: r.bezerro_id, tipo: r.tipo,
      sal_nome: r.sal_nome || '', sal_marca: r.sal_marca || '', sal_preco: r.sal_preco || '',
      data_inicio: r.data_inicio, data_fim: r.data_fim || '', observacoes: r.observacoes || ''
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.alimentacao.update(editing.id, form)
        toast.success('Registro atualizado')
      } else {
        await api.alimentacao.create(form)
        toast.success('Alimentação registrada')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.alimentacao.delete(deleteTarget.id)
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
          <h1 className="text-2xl font-bold text-white">Alimentação</h1>
          <p className="text-sm text-gray-500 mt-0.5">{registros.length} registros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo Registro
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Usando Sal</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{resumo.qtdSal}</p>
              </div>
              <div className="text-3xl">🧂</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Usando Ração</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{resumo.qtdRacao}</p>
              </div>
              <div className="text-3xl">🌾</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Gasto Total com Sal</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">R$ {resumo.totalSal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Buscar por bezerro, nome ou marca do sal..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">🌾</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum registro de alimentação</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Bezerro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome do Sal</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Preço (R$)</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-white">#{r.bezerro_numero}</TableCell>
                  <TableCell>
                    <Badge variant={r.tipo === 'sal' ? 'warning' : 'info'}>
                      {r.tipo === 'sal' ? '🧂 Sal' : '🌾 Ração'}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.sal_nome || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>{r.sal_marca || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell className="tabular-nums font-medium">{r.sal_preco ? `R$ ${r.sal_preco.toFixed(2)}` : <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell className="tabular-nums">{r.data_inicio}</TableCell>
                  <TableCell>
                    {r.data_fim ? (
                      <span className="tabular-nums">{r.data_fim}</span>
                    ) : (
                      <Badge variant="default">Em uso</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Pencil size={14} /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(r)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 size={14} /> Excluir
                        </DropdownMenuItem>
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
            <DialogTitle>{editing ? 'Editar Alimentação' : 'Nova Alimentação'}</DialogTitle>
            <DialogDescription>Registre o tipo de alimentação do bezerro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Bezerro *</Label>
              <Select required value={form.bezerro_id} onChange={e => setForm({ ...form, bezerro_id: Number(e.target.value) })}>
                <option value="">Selecione...</option>
                {bezerros.map(b => (
                  <option key={b.id} value={b.id}>#{b.numero}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Alimentação *</Label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({ ...form, tipo: 'sal' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${form.tipo === 'sal' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/10' : 'border-white/10 hover:border-white/20 text-gray-500'}`}>
                  <span className="text-lg">🧂</span> <span className="font-medium">Sal</span>
                </button>
                <button type="button" onClick={() => setForm({ ...form, tipo: 'racao' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${form.tipo === 'racao' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-sm shadow-blue-500/10' : 'border-white/10 hover:border-white/20 text-gray-500'}`}>
                  <span className="text-lg">🌾</span> <span className="font-medium">Ração</span>
                </button>
              </div>
            </div>
            {form.tipo === 'sal' && (
              <div className="space-y-3 bg-amber-500/5 rounded-xl p-4 border border-amber-500/15">
                <div className="space-y-2">
                  <Label className="text-amber-400">Nome do Sal</Label>
                  <Input value={form.sal_nome} onChange={e => setForm({ ...form, sal_nome: e.target.value })} placeholder="Ex: Sal Mineral Reprodução" className="border-amber-500/20 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-400">Marca</Label>
                  <Input value={form.sal_marca} onChange={e => setForm({ ...form, sal_marca: e.target.value })} placeholder="Ex: Matsuda, Tortuga, Guabi" className="border-amber-500/20 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-400">Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.sal_preco} onChange={e => setForm({ ...form, sal_preco: e.target.value })} placeholder="0.00" className="border-amber-500/20 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input type="date" required value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} />
              </div>
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
            <AlertDialogTitle>Excluir registro de alimentação?</AlertDialogTitle>
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
