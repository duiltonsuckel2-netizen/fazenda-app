import { Badge } from './ui/badge'

const variantMap = {
  ativa: 'default',
  descartada: 'secondary',
  morta: 'destructive',
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
}

const labels = {
  ativa: 'Ativa',
  descartada: 'Descartada',
  morta: 'Morta',
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
}

export default function StatusBadge({ value }) {
  return (
    <Badge variant={variantMap[value] || 'secondary'}>
      {labels[value] || value}
    </Badge>
  )
}
