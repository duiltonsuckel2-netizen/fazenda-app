import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
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
import { Plus, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { toast } from 'sonner'

const categorias = {
  receita: ['Venda de animal', 'Venda de leite', 'Venda de esterco', 'Arrendamento', 'Outros'],
  despesa: ['Alimentação', 'Sanidade', 'Mão de obra', 'Manutenção', 'Combustível', 'Energia', 'Insumos', 'Veterinário', 'Transporte', 'Impostos', 'Outros'],
}

const emptyForm = { tipo: 'despesa', categoria: '', descricao: '', valor: '', data: '', observacoes: '' }

export default function Financeiro() {
  const [registros, setRegistros] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => Promise.all([
    api.financeiro.list(filterTipo ? { tipo: filterTipo } : undefined).then(setRegistros),
    api.financeiro.resumo().then(setResumo),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [filterTipo])

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, data: new Date().toISOString().split('T')[0] }); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setForm({ tipo: r.tipo, categoria: r.categoria, descricao: r.descricao || '', valor: r.valor, data: r.data, observacoes: r.observacoes || '' })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.financeiro.update(editing.id, form)
        toast.success('Registro atualizado')
      } else {
        await api.financeiro.create(form)
        toast.success('Registro financeiro criado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.financeiro.delete(deleteTarget.id)
      toast.success('Registro excluído')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold page-title">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">{registros.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Novo Registro</Button>
      </div>

      {/* Resumo cards */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/25">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receitas</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmt(resumo.totalReceitas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25">
                  <TrendingDown size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">{fmt(resumo.totalDespesas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${resumo.saldo >= 0 ? 'from-blue-400 to-blue-600 shadow-blue-500/25' : 'from-orange-400 to-orange-600 shadow-orange-500/25'} shadow-lg`}>
                  <Wallet size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo</p>
                  <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{fmt(resumo.saldo)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custos integrados */}
      {resumo && (resumo.custoSanitario > 0 || resumo.custoAlimentacao > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              {resumo.custoSanitario > 0 && (
                <div>
                  <span className="text-gray-500">Custo Sanitário (total)</span>
                  <p className="text-red-400 font-semibold">{fmt(resumo.custoSanitario)}</p>
                </div>
              )}
              {resumo.custoAlimentacao > 0 && (
                <div>
                  <span className="text-gray-500">Custo Alimentação (sal)</span>
                  <p className="text-red-400 font-semibold">{fmt(resumo.custoAlimentacao)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro */}
      <Select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="sm:w-48">
        <option value="">Todos</option>
        <option value="receita">Receitas</option>
        <option value="despesa">Despesas</option>
      </Select>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : registros.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">&#x1F4B0;</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum registro financeiro</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="tabular-nums">{r.data}</TableCell>
                  <TableCell><StatusBadge value={r.tipo} /></TableCell>
                  <TableCell className="text-white">{r.categoria}</TableCell>
                  <TableCell>{r.descricao || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell className={`tabular-nums font-semibold ${r.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.tipo === 'receita' ? '+' : '-'} {fmt(r.valor)}
                  </TableCell>
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
            <DialogTitle>{editing ? 'Editar Registro' : 'Novo Registro Financeiro'}</DialogTitle>
            <DialogDescription>Registre receitas e despesas da propriedade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({ ...form, tipo: 'receita', categoria: '' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${form.tipo === 'receita' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 hover:border-white/20 text-gray-500'}`}>
                  <TrendingUp size={18} /> <span className="font-medium">Receita</span>
                </button>
                <button type="button" onClick={() => setForm({ ...form, tipo: 'despesa', categoria: '' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${form.tipo === 'despesa' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/10 hover:border-white/20 text-gray-500'}`}>
                  <TrendingDown size={18} /> <span className="font-medium">Despesa</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select required value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="">Selecione...</option>
                  {categorias[form.tipo].map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" required value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
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
            <AlertDialogTitle>Excluir registro financeiro?</AlertDialogTitle>
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
