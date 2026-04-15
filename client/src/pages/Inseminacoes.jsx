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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = { matriz_id: '', data: '', tipo: 'IA', touro_semen: '', observacoes: '' }

export default function Inseminacoes() {
  const [inseminacoes, setInseminacoes] = useState([])
  const [matrizes, setMatrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const confirmDelete = async () => {
    try {
      await api.inseminacoes.delete(deleteTarget.id)
      toast.success('Inseminação excluída')
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
          <h1 className="text-2xl font-bold text-white">Inseminações</h1>
          <p className="text-sm text-gray-500 mt-0.5">{inseminacoes.length} registros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nova Inseminação
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : inseminacoes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">💉</div>
            <p className="text-lg text-gray-500 font-medium">Nenhuma inseminação registrada</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre matrizes primeiro, depois registre inseminações</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Matriz</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Touro/Sêmen</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inseminacoes.map(ins => (
                <TableRow key={ins.id}>
                  <TableCell className="font-semibold text-white">
                    #{ins.matriz_numero} {ins.matriz_nome && <span className="text-gray-500 font-normal">({ins.matriz_nome})</span>}
                  </TableCell>
                  <TableCell className="tabular-nums">{ins.data}</TableCell>
                  <TableCell><StatusBadge value={ins.tipo} /></TableCell>
                  <TableCell>{ins.touro_semen || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={ins.resultado} />
                      {ins.resultado === 'pendente' && (
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setResultado(ins, 'prenha')}>
                                <CheckCircle size={15} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como Prenha</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setResultado(ins, 'vazia')}>
                                <XCircle size={15} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como Vazia</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ins)}>
                          <Pencil size={14} /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(ins)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
            <DialogTitle>{editing ? 'Editar Inseminação' : 'Nova Inseminação'}</DialogTitle>
            <DialogDescription>{editing ? 'Atualize os dados.' : 'Registre uma nova inseminação.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Matriz *</Label>
              <Select required value={form.matriz_id} onChange={e => setForm({ ...form, matriz_id: Number(e.target.value) })}>
                <option value="">Selecione a matriz...</option>
                {matrizes.filter(m => m.status === 'ativa').map(m => (
                  <option key={m.id} value={m.id}>#{m.numero} {m.nome ? `- ${m.nome}` : ''}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="IA">Inseminação Artificial</option>
                  <option value="MN">Monta Natural (Touro)</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Touro / Sêmen</Label>
              <Input value={form.touro_semen} onChange={e => setForm({ ...form, touro_semen: e.target.value })} placeholder="Nome do touro ou código do sêmen" />
            </div>
            {editing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <Select value={form.resultado} onChange={e => setForm({ ...form, resultado: e.target.value })}>
                    <option value="pendente">Pendente</option>
                    <option value="prenha">Prenha</option>
                    <option value="vazia">Vazia</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Resultado</Label>
                  <Input type="date" value={form.data_resultado} onChange={e => setForm({ ...form, data_resultado: e.target.value })} />
                </div>
              </div>
            )}
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
            <AlertDialogTitle>Excluir inseminação?</AlertDialogTitle>
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
