import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Camera, Upload, FileText, Trash2, Check, Printer, Loader2, AlertTriangle, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'

const TIPO_LABELS = {
  matriz: 'Matriz',
  touro: 'Touro',
  inseminacao: 'Inseminação',
  bezerro: 'Bezerro (parto)',
  pesagem: 'Pesagem',
  sanitario: 'Sanitário',
  alimentacao: 'Alimentação',
  financeiro: 'Financeiro',
  outro: 'Outro',
}

const TIPO_COLORS = {
  matriz: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  touro: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  inseminacao: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  bezerro: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  pesagem: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  sanitario: 'bg-red-500/15 text-red-300 border-red-500/30',
  alimentacao: 'bg-green-500/15 text-green-300 border-green-500/30',
  financeiro: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  outro: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
}

function confColor(c) {
  if (c == null) return 'text-gray-500'
  if (c >= 0.85) return 'text-emerald-400'
  if (c >= 0.6) return 'text-amber-400'
  return 'text-red-400'
}

export default function ImportarCaderno() {
  const [tab, setTab] = useState('importar') // 'importar' | 'modelos'
  const [files, setFiles] = useState([]) // File[]
  const [previews, setPreviews] = useState([]) // string[] (object URLs)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([]) // [{filename, preview_url, eventos:[]}]
  const [committing, setCommitting] = useState(false)
  const [matrizes, setMatrizes] = useState([])
  const [touros, setTouros] = useState([])
  const [bezerros, setBezerros] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    api.matrizes.list().then(setMatrizes).catch(() => {})
    api.touros.list().then(setTouros).catch(() => {})
    api.bezerros.list().then(setBezerros).catch(() => {})
  }, [])

  const onPickFiles = (e) => {
    const sel = Array.from(e.target.files || [])
    if (!sel.length) return
    const accepted = sel.filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...accepted])
    setPreviews(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(files.filter((_, i) => i !== idx))
    setPreviews(previews.filter((_, i) => i !== idx))
  }

  const onDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
    if (!dropped.length) return
    setFiles(prev => [...prev, ...dropped])
    setPreviews(prev => [...prev, ...dropped.map(f => URL.createObjectURL(f))])
  }

  const extract = async () => {
    if (!files.length) return
    setLoading(true)
    setResults([])
    try {
      const r = await api.ocr.extract(files)
      // Anexa estado de "aprovado" e mantém objeto editável
      const enriched = r.results.map((res, fileIdx) => ({
        ...res,
        local_preview: previews[fileIdx],
        eventos: (res.eventos || []).map((ev, i) => ({ ...ev, _id: `${fileIdx}-${i}`, _approved: !res.error })),
      }))
      setResults(enriched)
      const total = enriched.reduce((s, r) => s + r.eventos.length, 0)
      const errors = enriched.filter(r => r.error).length
      if (errors) toast.error(`${errors} foto(s) com erro de extração`)
      toast.success(`${total} eventos extraídos`)
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateEvento = (resIdx, evIdx, patch) => {
    setResults(prev => prev.map((r, i) => i === resIdx ? {
      ...r,
      eventos: r.eventos.map((ev, j) => j === evIdx ? { ...ev, ...patch } : ev),
    } : r))
  }

  const removeEvento = (resIdx, evIdx) => {
    setResults(prev => prev.map((r, i) => i === resIdx ? {
      ...r,
      eventos: r.eventos.filter((_, j) => j !== evIdx),
    } : r))
  }

  const allEventos = results.flatMap(r => r.eventos)
  const approvedCount = allEventos.filter(e => e._approved).length

  const commit = async () => {
    const aprovados = allEventos.filter(e => e._approved).map(({ _id, _approved, ...rest }) => rest)
    if (!aprovados.length) {
      toast.error('Nenhum evento aprovado')
      return
    }
    setCommitting(true)
    try {
      const r = await api.ocr.commit(aprovados)
      toast.success(`${r.gravados} eventos gravados${r.erros.length ? ` (${r.erros.length} erros)` : ''}`)
      if (r.erros.length) {
        console.warn('Erros ao gravar:', r.erros)
      }
      // Recarrega listas pra próximas extrações terem contexto atualizado
      api.matrizes.list().then(setMatrizes).catch(() => {})
      api.touros.list().then(setTouros).catch(() => {})
      api.bezerros.list().then(setBezerros).catch(() => {})
      // Remove eventos gravados com sucesso
      const erroIds = new Set(r.erros.map(e => e.texto_original))
      setResults(prev => prev.map(res => ({
        ...res,
        eventos: res.eventos.filter(ev => !ev._approved || erroIds.has(ev.texto_original)),
      })).filter(res => res.eventos.length > 0 || res.error))
    } catch (err) {
      toast.error('Erro ao gravar: ' + err.message)
    } finally {
      setCommitting(false)
    }
  }

  const reset = () => {
    previews.forEach(URL.revokeObjectURL)
    setFiles([])
    setPreviews([])
    setResults([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold page-title flex items-center gap-2">
            <Camera size={24} className="text-emerald-400" />
            Importar do Caderno
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tire foto da folha → Claude extrai os eventos → revise e grave</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        <button
          onClick={() => setTab('importar')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'importar' ? 'text-emerald-400 border-emerald-400' : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          <Upload size={16} className="inline mr-2" />
          Enviar Foto
        </button>
        <button
          onClick={() => setTab('modelos')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'modelos' ? 'text-emerald-400 border-emerald-400' : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Modelos Imprimíveis
        </button>
      </div>

      {tab === 'importar' && (
        <>
          {/* Upload */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-emerald-500/40 transition-colors cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">
                  Arraste fotos aqui, ou <span className="text-emerald-400 font-medium">clique pra selecionar</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">JPG/PNG/HEIC — até 15MB cada — múltiplas fotos OK</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={onPickFiles}
                  className="hidden"
                />
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {previews.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                        {files[i]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={extract} disabled={!files.length || loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Extraindo...</> : <><Sparkles size={16} /> Extrair Eventos ({files.length})</>}
                </Button>
                {(files.length > 0 || results.length > 0) && (
                  <Button variant="outline" onClick={reset} disabled={loading || committing}>
                    <Trash2 size={16} /> Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {loading && (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <Loader2 size={32} className="mx-auto animate-spin text-emerald-400" />
                <p className="text-sm text-gray-400">Claude está lendo as fotos...</p>
                <p className="text-xs text-gray-600">~15-30 segundos por foto</p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <>
              {/* Barra de ação flutuante */}
              <div className="sticky top-16 z-20 bg-[#13151b]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-xl">
                <div className="text-sm">
                  <span className="text-emerald-400 font-semibold">{approvedCount}</span>
                  <span className="text-gray-400"> de {allEventos.length} eventos aprovados</span>
                </div>
                <Button onClick={commit} disabled={committing || approvedCount === 0}>
                  {committing ? <><Loader2 size={16} className="animate-spin" /> Gravando...</> : <><Check size={16} /> Gravar {approvedCount} eventos</>}
                </Button>
              </div>

              {results.map((res, resIdx) => (
                <Card key={resIdx}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-4 flex-col lg:flex-row">
                      {/* Foto */}
                      <div className="lg:w-1/3 lg:sticky lg:top-32">
                        <p className="text-xs text-gray-500 mb-2 truncate">{res.filename}</p>
                        <img
                          src={res.local_preview || res.preview_url}
                          alt=""
                          className="w-full rounded-lg border border-white/10"
                        />
                        {res.error && (
                          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                            <AlertTriangle size={14} className="inline mr-1" />
                            {res.error}
                          </div>
                        )}
                      </div>

                      {/* Eventos */}
                      <div className="lg:w-2/3 flex-1 space-y-3 w-full">
                        {res.eventos.length === 0 && !res.error && (
                          <p className="text-sm text-gray-500 text-center py-8">Nenhum evento extraído</p>
                        )}
                        {res.eventos.map((ev, evIdx) => (
                          <EventoCard
                            key={ev._id}
                            evento={ev}
                            onChange={(patch) => updateEvento(resIdx, evIdx, patch)}
                            onRemove={() => removeEvento(resIdx, evIdx)}
                            matrizes={matrizes}
                            touros={touros}
                            bezerros={bezerros}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {!loading && results.length === 0 && files.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">📓</div>
                <p className="text-lg text-gray-400 font-medium">Como funciona</p>
                <ol className="text-sm text-gray-500 mt-3 space-y-1 max-w-md mx-auto text-left list-decimal list-inside">
                  <li>Imprima os modelos da aba <span className="text-emerald-400">Modelos Imprimíveis</span></li>
                  <li>Anote no campo durante o dia</li>
                  <li>Tire foto da folha (uma ou várias)</li>
                  <li>Solte aqui e clique em <span className="text-emerald-400">Extrair Eventos</span></li>
                  <li>Revise os campos extraídos e clique em <span className="text-emerald-400">Gravar</span></li>
                </ol>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {tab === 'modelos' && <ModelosImprimiveis />}
    </div>
  )
}

// =====================================================================
// EventoCard — card editável de um evento extraído
// =====================================================================
function EventoCard({ evento, onChange, onRemove, matrizes, touros, bezerros }) {
  const ev = evento
  const tipo = ev.tipo || 'outro'

  const animaisDoTipo = (t) => {
    if (t === 'matriz') return matrizes
    if (t === 'touro') return touros
    if (t === 'bezerro') return bezerros
    return []
  }

  const fieldsByTipo = {
    matriz: ['numero', 'nome', 'raca', 'data', 'observacoes'],
    touro: ['numero', 'nome', 'raca', 'data', 'observacoes'],
    inseminacao: ['matriz_ref', 'data', 'tipo_inseminacao', 'touro_semen', 'observacoes'],
    bezerro: ['numero', 'matriz_ref', 'data', 'sexo', 'peso_nascimento', 'tipo_inseminacao', 'observacoes'],
    pesagem: ['animal_ref', 'data', 'peso', 'observacoes'],
    sanitario: ['animal_tipo', 'animal_ref', 'sanitario_tipo', 'nome', 'data', 'proxima_data', 'dose', 'custo', 'veterinario', 'observacoes'],
    alimentacao: ['animal_ref', 'alimentacao_tipo', 'sal_nome', 'sal_marca', 'sal_preco', 'data', 'observacoes'],
    financeiro: ['financeiro_tipo', 'categoria', 'valor', 'data', 'descricao', 'observacoes'],
    outro: ['observacoes'],
  }

  const fields = fieldsByTipo[tipo] || []

  return (
    <div className={`rounded-xl border p-4 transition-all ${ev._approved ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${TIPO_COLORS[tipo]} border`}>{TIPO_LABELS[tipo]}</Badge>
          <span className={`text-xs font-mono ${confColor(ev.confianca)}`}>
            {ev.confianca != null ? `${Math.round(ev.confianca * 100)}% confiança` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ _approved: !ev._approved })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              ev._approved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            {ev._approved ? <><Check size={12} className="inline mr-1" /> Aprovado</> : 'Aprovar'}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {ev.texto_original && (
        <p className="text-xs text-gray-500 italic mb-3 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
          "{ev.texto_original}"
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Tipo de evento</Label>
          <Select value={tipo} onChange={(e) => onChange({ tipo: e.target.value })}>
            {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>

        {fields.map((f) => (
          <FieldEditor
            key={f}
            name={f}
            value={ev[f]}
            onChange={(v) => onChange({ [f]: v })}
            tipo={tipo}
            evento={ev}
            animais={animaisDoTipo(ev.animal_tipo || (tipo === 'pesagem' || tipo === 'alimentacao' ? 'bezerro' : 'matriz'))}
            allMatrizes={matrizes}
            allTouros={touros}
            allBezerros={bezerros}
          />
        ))}
      </div>
    </div>
  )
}

function FieldEditor({ name, value, onChange, tipo, evento, animais, allMatrizes, allTouros, allBezerros }) {
  const labels = {
    numero: 'Número/Brinco',
    nome: 'Nome',
    raca: 'Raça',
    data: 'Data',
    proxima_data: 'Próxima dose',
    matriz_ref: 'Vaca (mãe / inseminada)',
    animal_ref: 'Animal',
    animal_tipo: 'Tipo de animal',
    sexo: 'Sexo',
    peso: 'Peso (kg)',
    peso_nascimento: 'Peso ao nascer (kg)',
    tipo_inseminacao: 'Tipo (IA/MN)',
    touro_semen: 'Touro / Sêmen',
    sanitario_tipo: 'Tipo (vacina/vermífugo)',
    dose: 'Dose',
    custo: 'Custo (R$)',
    veterinario: 'Veterinário',
    alimentacao_tipo: 'Tipo (sal/ração)',
    sal_nome: 'Nome do produto',
    sal_marca: 'Marca',
    sal_preco: 'Preço (R$)',
    financeiro_tipo: 'Tipo (receita/despesa)',
    categoria: 'Categoria',
    valor: 'Valor (R$)',
    descricao: 'Descrição',
    observacoes: 'Observações',
  }

  const isFullWidth = ['observacoes', 'descricao'].includes(name)

  // Selects fixos
  if (name === 'sexo') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="M">Macho</option><option value="F">Fêmea</option>
      </Select>
    </Wrap>
  )
  if (name === 'tipo_inseminacao') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="IA">IA (inseminação)</option><option value="MN">MN (monta natural)</option>
      </Select>
    </Wrap>
  )
  if (name === 'sanitario_tipo') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="vacina">Vacina</option><option value="vermifugo">Vermífugo</option><option value="tratamento">Tratamento</option><option value="exame">Exame</option>
      </Select>
    </Wrap>
  )
  if (name === 'alimentacao_tipo') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="sal">Sal mineral</option><option value="racao">Ração</option>
      </Select>
    </Wrap>
  )
  if (name === 'financeiro_tipo') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="receita">Receita</option><option value="despesa">Despesa</option>
      </Select>
    </Wrap>
  )
  if (name === 'animal_tipo') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option><option value="matriz">Matriz</option><option value="bezerro">Bezerro</option><option value="touro">Touro</option>
      </Select>
    </Wrap>
  )

  // Animal refs com sugestão
  if (name === 'matriz_ref' || name === 'animal_ref') {
    const lista = name === 'matriz_ref' ? allMatrizes :
      (evento.animal_tipo === 'bezerro' || tipo === 'pesagem' || tipo === 'alimentacao') ? allBezerros :
      evento.animal_tipo === 'touro' ? allTouros : allMatrizes
    return (
      <Wrap><Label className="text-xs">{labels[name]}</Label>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Ex: vaca 23, Mimosa, brinco 101"
          list={`animais-${name}-${evento._id}`}
        />
        <datalist id={`animais-${name}-${evento._id}`}>
          {lista.map(a => <option key={a.id} value={`${a.numero}${a.nome ? ' (' + a.nome + ')' : ''}`} />)}
        </datalist>
      </Wrap>
    )
  }

  // Datas
  if (name === 'data' || name === 'proxima_data') return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Input type="date" value={value || ''} onChange={(e) => onChange(e.target.value || null)} />
    </Wrap>
  )

  // Números
  if (['peso', 'peso_nascimento', 'custo', 'sal_preco', 'valor'].includes(name)) return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Input type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
    </Wrap>
  )

  // Texto longo
  if (isFullWidth) return (
    <Wrap full><Label className="text-xs">{labels[name]}</Label>
      <Textarea value={value || ''} onChange={(e) => onChange(e.target.value || null)} rows={2} />
    </Wrap>
  )

  // Texto padrão
  return (
    <Wrap><Label className="text-xs">{labels[name]}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value || null)} />
    </Wrap>
  )
}

function Wrap({ children, full }) {
  return <div className={`space-y-1 ${full ? 'sm:col-span-2' : ''}`}>{children}</div>
}

// =====================================================================
// Modelos imprimíveis
// =====================================================================
const TEMPLATES = [
  {
    id: 'matrizes',
    titulo: 'Cadastro de Matrizes (Vacas)',
    descricao: 'Use pra registrar novas vacas no rebanho',
    cabecalho: ['Nº', 'Nome (apelido)', 'Raça', 'Data nasc.', 'Observações'],
    linhas: 12,
    exemplo: ['200', 'Estrela', 'Nelore', '15/03/2022', '—'],
  },
  {
    id: 'touros',
    titulo: 'Cadastro de Touros',
    descricao: 'Pra registrar novos reprodutores',
    cabecalho: ['Nº', 'Nome', 'Raça', 'Data nasc.', 'Observações'],
    linhas: 6,
    exemplo: ['60', 'Imperador', 'Nelore', '10/05/2020', '—'],
  },
  {
    id: 'bezerros',
    titulo: 'Nascimentos / Partos',
    descricao: 'Anote cada bezerro nascido',
    cabecalho: ['Brinco bezerro', 'Mãe (vaca nº)', 'Data parto', 'Sexo (M/F)', 'Peso nasc. (kg)', 'IA/MN'],
    linhas: 10,
    exemplo: ['300', '200', '14/04/2026', 'M', '35', 'IA'],
  },
  {
    id: 'pesagens',
    titulo: 'Pesagens de Bezerros',
    descricao: 'Pesagem rotineira pra acompanhar crescimento',
    cabecalho: ['Bezerro nº', 'Data', 'Peso (kg)'],
    linhas: 18,
    exemplo: ['300', '16/04/2026', '38'],
  },
  {
    id: 'inseminacoes',
    titulo: 'Inseminações',
    descricao: 'IA ou monta natural',
    cabecalho: ['Vaca nº', 'Data', 'Tipo (IA/MN)', 'Touro / Sêmen', 'Observações'],
    linhas: 12,
    exemplo: ['200', '10/04/2026', 'IA', 'Imperador', '—'],
  },
  {
    id: 'sanitario',
    titulo: 'Sanitário (Vacinas / Vermífugos / Tratamentos)',
    descricao: 'Tudo que entrar de medicamento',
    cabecalho: ['Animal (tipo + nº)', 'Tipo', 'Produto', 'Data', 'Próx. dose', 'Dose', 'Custo (R$)'],
    linhas: 12,
    exemplo: ['Vaca 200', 'Vacina', 'Aftosa', '12/04/2026', '—', '5ml', '25,00'],
  },
  {
    id: 'alimentacao',
    titulo: 'Alimentação (Sal / Ração)',
    descricao: 'Início de alimentação por bezerro',
    cabecalho: ['Bezerro nº', 'Tipo (sal/ração)', 'Produto', 'Marca', 'Preço (R$)', 'Data início'],
    linhas: 8,
    exemplo: ['300', 'Sal', 'Mineral 80', 'Matsuda', '180,00', '14/04/2026'],
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro (Receitas / Despesas)',
    descricao: 'Entradas e saídas',
    cabecalho: ['Tipo (rec/desp)', 'Categoria', 'Descrição', 'Valor (R$)', 'Data'],
    linhas: 14,
    exemplo: ['Despesa', 'Alimentação', 'Ração 25kg', '450,00', '15/04/2026'],
  },
]

function ModelosImprimiveis() {
  const [selected, setSelected] = useState(TEMPLATES.map(t => t.id))

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3 print:hidden">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-white">Modelos pra preencher no caderno</h3>
              <p className="text-sm text-gray-500 mt-1">Marque os modelos que quer imprimir e clique em "Imprimir". Use papel A4 e canetinha esferográfica preta/azul (boa pra OCR).</p>
            </div>
            <Button onClick={handlePrint}>
              <Printer size={16} /> Imprimir Selecionados ({selected.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEMPLATES.map(t => (
              <label
                key={t.id}
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  selected.includes(t.id)
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{t.titulo}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.descricao}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Área de impressão */}
      <div className="space-y-4">
        {TEMPLATES.filter(t => selected.includes(t.id)).map(t => (
          <TemplatePrintable key={t.id} template={t} />
        ))}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-template, .print-template * { visibility: visible; }
          .print-template { position: relative; page-break-after: always; }
          .print-template:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  )
}

function TemplatePrintable({ template }) {
  return (
    <Card className="print-template print:shadow-none print:border-0">
      <CardContent className="p-6 print:p-4 print:bg-white print:text-black">
        <div className="border-b border-gray-300 print:border-black pb-3 mb-4">
          <h2 className="text-xl font-bold text-white print:text-black">{template.titulo}</h2>
          <p className="text-sm text-gray-500 print:text-gray-600 mt-1">{template.descricao}</p>
          <div className="flex justify-between items-center mt-3 text-xs text-gray-400 print:text-gray-700">
            <span>Data: ___ / ___ / ______</span>
            <span>Folha __ de __</span>
          </div>
        </div>

        {/* Linha de exemplo */}
        <div className="text-xs text-gray-500 print:text-gray-600 mb-2 italic">
          Exemplo: {template.cabecalho.map((c, i) => <span key={i}>{c} = <span className="font-mono">{template.exemplo[i] || '—'}</span>{i < template.cabecalho.length - 1 ? ' · ' : ''}</span>)}
        </div>

        {/* Tabela */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {template.cabecalho.map((h, i) => (
                <th
                  key={i}
                  className="border border-gray-400 print:border-black bg-white/[0.05] print:bg-gray-100 px-2 py-2 text-left text-xs font-semibold text-white print:text-black"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: template.linhas }).map((_, r) => (
              <tr key={r}>
                {template.cabecalho.map((_, c) => (
                  <td
                    key={c}
                    className="border border-gray-400 print:border-black h-10 print:h-12 text-white print:text-black"
                  ></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-[10px] text-gray-500 print:text-gray-600">
          Dica: escreva claro com caneta preta. Use abreviações simples (vaca 23, IA, MN). Quando faltar um campo, deixe em branco — o sistema entende.
        </div>
      </CardContent>
    </Card>
  )
}
