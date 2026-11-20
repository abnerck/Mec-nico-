import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSearch,
  PackageCheck,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import type { OrderStatus } from '../types/workshop';

interface StatusLabelProps {
  status: OrderStatus;
}

const STATUS_STYLE: Record<
  OrderStatus,
  { bg: string; text: string; border: string; Icon: typeof Clock }
> = {
  Recibido: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    Icon: ClipboardCheck,
  },
  'En Diagnóstico': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    Icon: FileSearch,
  },
  'Esperando Aprobación': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    Icon: AlertCircle,
  },
  'En Reparación': {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: Wrench,
  },
  'Pruebas Finales': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    Icon: Clock,
  },
  'Listo para Entrega': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    Icon: PackageCheck,
  },
  Entregado: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    Icon: CheckCircle2,
  },
};

export function StatusLabel({ status }: StatusLabelProps) {
  const { bg, text, border, Icon } = STATUS_STYLE[status] ?? STATUS_STYLE.Recibido;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${bg} ${text} ${border}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
