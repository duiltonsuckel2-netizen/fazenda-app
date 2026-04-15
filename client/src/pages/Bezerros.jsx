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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

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
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const confirmDelete = async () => {
    try {
      await api.bezerros.delete(deleteTarget.id)
      toast.success('Bezerro excluído')
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
          <h1 className="text-2xl font-bold text-gray-900">Bezerros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bezerros.length} registros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo Bezerro
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar por número ou mãe..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterDestino} onChange={e => setFilterDestino(e.target.value)} className="sm:w-48">
          <option value="">Todos os destinos</option>
          <option value="na_fazenda">Na Fazenda</option>
          <option value="vendido_desmame">Vendido (Desmame)</option>
          <option value="escalada">Escalada</option>
          <option value="frigorifico">Frigorífico</option>
          <option value="ipe">IPÊ</option>
        </Select>
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">🐂</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum bezerro encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead>Número</TableHead>
                <TableHead>Mãe</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Concepção</TableHead>
                <TableHead>Peso Atual</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold text-gray-900">#{b.numero}</TableCell>
                  <TableCell>#{b.matriz_numero} {b.matriz_nome && <span className="text-gray-400">({b.matriz_nome})</span>}</TableCell>
                  <TableCell className="tabular-nums">{b.data_nascimento}</TableCell>
                  <TableCell><StatusBadge value={b.sexo} /></TableCell>
                  <TableCell><StatusBadge value={b.tipo_concepcao} /></TableCell>
                  <TableCell className="tabular-nums font-medium">{b.peso_atual ? `${b.peso_atual} kg` : <span className="text-gray-300">—</span>}</TableCell>
                  <TableCell><StatusBadge value={b.destino} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDestino(b)}>
                          <MapPin size={14} /> Definir Destino
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(b)}>
                          <Pencil size={14} /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(b)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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

      {/* Modal cadastro/edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Bezerro' : 'Novo Bezerro'}</DialogTitle>
            <DialogDescription>{editing ? 'Atualize os dados do bezerro.' : 'Cadastre um novo bezerro.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número / Brinco *</Label>
                <Input required value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mãe (Matriz) *</Label>
                <Select required value={form.matriz_id} onChange={e => setForm({ ...form, matriz_id: Number(e.target.value) })}>
                  <option value="">Selecione...</option>
                  {matrizes.map(m => (
                    <option key={m.id} value={m.id}>#{m.numero} {m.nome ? `- ${m.nome}` : ''}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nascimento *</Label>
                <Input type="date" required value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sexo *</Label>
                <Select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Concepção *</Label>
                <Select value={form.tipo_concepcao} onChange={e => setForm({ ...form, tipo_concepcao: e.target.value })}>
                  <option value="IA">Inseminação Artificial</option>
                  <option value="MN">Monta Natural</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Peso ao Nascer (kg)</Label>
              <Input type="number" step="0.1" value={form.peso_nascimento} onChange={e => setForm({ ...form, peso_nascimento: e.target.value })} />
            </div>
            {editing && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso Desmame (kg)</Label>
                    <Input type="number" step="0.1" value={form.peso_desmame} onChange={e => setForm({ ...form, peso_desmame: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Atual (kg)</Label>
                    <Input type="number" step="0.1" value={form.peso_atual} onChange={e => setForm({ ...form, peso_atual: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })}>
                      <option value="na_fazenda">Na Fazenda</option>
                      <option value="vendido_desmame">Vendido (Desmame)</option>
                      <option value="escalada">Escalada</option>
                      <option value="frigorifico">Frigorífico</option>
                      <option value="ipe">IPÊ</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Destino</Label>
                    <Input type="date" value={form.data_destino} onChange={e => setForm({ ...form, data_destino: e.target.value })} />
                  </div>
                </div>
                {(form.destino === 'vendido_desmame' || form.destino === 'frigorifico') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Venda (R$)</Label>
                      <Input type="number" step="0.01" value={form.valor_venda} onChange={e => setForm({ ...form, valor_venda: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Comprador</Label>
                      <Input value={form.comprador} onChange={e => setForm({ ...form, comprador: e.target.value })} />
                    </div>
                  </div>
                )}
              </>
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

      {/* Modal destino rápido */}
      <Dialog open={!!destinoModal} onOpenChange={(open) => !open && setDestinoModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Destino — #{destinoModal?.numero}</DialogTitle>
            <DialogDescription>Escolha o novo destino do bezerro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDestino} className="space-y-4">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-700">Fluxo do bezerro:</p>
                <p className="mt-1.5">Na Fazenda → <strong>Vendido no Desmame</strong> ou <strong>Escalada</strong></p>
                <p>Escalada → <strong>Frigorífico</strong> (bateu peso) ou <strong>IPÊ</strong> (não bateu)</p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label>Novo Destino *</Label>
              <Select required value={destinoForm.destino} onChange={e => setDestinoForm({ ...destinoForm, destino: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="vendido_desmame">Vendido no Desmame</option>
                <option value="escalada">Enviado para Escalada</option>
                <option value="frigorifico">Frigorífico (bateu peso)</option>
                <option value="ipe">IPÊ (não bateu peso)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={destinoForm.data_destino} onChange={e => setDestinoForm({ ...destinoForm, data_destino: e.target.value })} />
            </div>
            {(destinoForm.destino === 'vendido_desmame' || destinoForm.destino === 'frigorifico') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Venda (R$)</Label>
                  <Input type="number" step="0.01" value={destinoForm.valor_venda} onChange={e => setDestinoForm({ ...destinoForm, valor_venda: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Comprador</Label>
                  <Input value={destinoForm.comprador} onChange={e => setDestinoForm({ ...destinoForm, comprador: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDestinoModal(null)}>Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Confirmar Destino</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bezerro #{deleteTarget?.numero}?</AlertDialogTitle>
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
