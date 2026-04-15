import { Badge } from './ui/badge'

const variantMap = {
  ativa: 'default',
  ativo: 'default',
  descartada: 'secondary',
  descartado: 'secondary',
  morta: 'destructive',
  morto: 'destructive',
  pendente: 'warning',
  prenha: 'default',
  vazia: 'destructive',
  na_fazenda: 'info',
  vendido_desmame: 'warning',
  escalada: 'purple',
  frigorifico: 'orange',
  ipe: 'teal',
  IA: 'info',
  MN: 'warning',
  M: 'info',
  F: 'pink',
  // Sanitário
  vacina: 'default',
  vermifugo: 'purple',
  tratamento: 'warning',
  exame: 'info',
  // Piquetes
  em_descanso: 'warning',
  em_reforma: 'orange',
  // Financeiro
  receita: 'default',
  despesa: 'destructive',
  // Animal tipos
  matriz: 'pink',
  bezerro: 'info',
  touro: 'purple',
}

const labels = {
  ativa: 'Ativa',
  ativo: 'Ativo',
  descartada: 'Descartada',
  descartado: 'Descartado',
  morta: 'Morta',
  morto: 'Morto',
  pendente: 'Pendente',
  prenha: 'Prenha',
  vazia: 'Vazia',
  na_fazenda: 'Na Fazenda',
  vendido_desmame: 'Vendido (Desmame)',
  escalada: 'Escalada',
  frigorifico: 'Frigorífico',
  ipe: 'IPÊ',
  IA: 'Insem. Artificial',
  MN: 'Monta Natural',
  M: 'Macho',
  F: 'Fêmea',
  // Sanitário
  vacina: 'Vacina',
  vermifugo: 'Vermífugo',
  tratamento: 'Tratamento',
  exame: 'Exame',
  // Piquetes
  em_descanso: 'Em Descanso',
  em_reforma: 'Em Reforma',
  // Financeiro
  receita: 'Receita',
  despesa: 'Despesa',
  // Animal tipos
  matriz: 'Matriz',
  bezerro: 'Bezerro',
  touro: 'Touro',
}

export default function StatusBadge({ value }) {
  return (
    <Badge variant={variantMap[value] || 'secondary'}>
      {labels[value] || value}
    </Badge>
  )
}
