const colors = {
  ativa: 'bg-green-100 text-green-700',
  descartada: 'bg-gray-100 text-gray-600',
  morta: 'bg-red-100 text-red-600',
  pendente: 'bg-yellow-100 text-yellow-700',
  prenha: 'bg-green-100 text-green-700',
  vazia: 'bg-red-100 text-red-600',
  na_fazenda: 'bg-blue-100 text-blue-700',
  vendido_desmame: 'bg-amber-100 text-amber-700',
  escalada: 'bg-purple-100 text-purple-700',
  frigorifico: 'bg-orange-100 text-orange-700',
  ipe: 'bg-teal-100 text-teal-700',
  IA: 'bg-blue-100 text-blue-700',
  MN: 'bg-amber-100 text-amber-700',
  M: 'bg-blue-100 text-blue-700',
  F: 'bg-pink-100 text-pink-700',
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {labels[value] || value}
    </span>
  )
}
