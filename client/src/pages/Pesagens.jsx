import { useEffect, useState } from 'react'
import { api } from '../api'
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
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Pesagens() {
  const [pesagens, setPesagens] = useState([])
  const [bezerros, setBezerros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ bezerro_id: '', data: '', peso: '', observacoes: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => Promise.all([
    api.pesagens.list().then(setPesagens),
    api.bezerros.list().then(setBezerros),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm({ bezerro_id: '', data: new Date().toISOString().split('T')[0], peso: '', observacoes: '' })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      await api.pesagens.create({ ...form, bezerro_id: Number(form.bezerro_id), peso: Number(form.peso) })
      toast.success('Pesagem registrada! Peso atual do bezerro atualizado.')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.pesagens.delete(deleteTarget.id)
      toast.success('Pesagem excluída')
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
          <h1 className="text-2xl font-bold text-white">Pesagens</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pesagens.length} registros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nova Pesagem
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      ) : pesagens.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-lg text-gray-500 font-medium">Nenhuma pesagem registrada</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre bezerros e registre suas pesagens</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead>Bezerro</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pesagens.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold text-white">#{p.bezerro_numero}</TableCell>
                  <TableCell className="tabular-nums">{p.data}</TableCell>
                  <TableCell className="font-bold text-emerald-400 tabular-nums">{p.peso} kg</TableCell>
                  <TableCell className="text-gray-400 max-w-xs truncate">{p.observacoes || <span className="text-gray-600">—</span>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(p)}>
                      <Trash2 size={15} />
                    </Button>
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
            <DialogTitle>Nova Pesagem</DialogTitle>
            <DialogDescription>Registre o peso atual de um bezerro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Bezerro *</Label>
              <Select required value={form.bezerro_id} onChange={e => setForm({ ...form, bezerro_id: e.target.value })}>
                <option value="">Selecione o bezerro...</option>
                {bezerros.map(b => (
                  <option key={b.id} value={b.id}>#{b.numero} - Mãe: #{b.matriz_numero}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Peso (kg) *</Label>
                <Input type="number" step="0.1" required value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pesagem?</AlertDialogTitle>
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
