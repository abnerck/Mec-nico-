import { useState } from 'react';
import { Check, CheckCircle2, Clock, Wrench, User, MapPin } from 'lucide-react';
import { ORDER_STAGES, type RepairOrder } from '../types/workshop';
import { StatusLabel } from './StatusLabel';

interface OrderTrackerProps {
  order: RepairOrder | null;
  loading?: boolean;
  error?: string | null;
  onApproveQuote: (orderId: string) => Promise<void>;
}

const PROGRESS_STAGES = ORDER_STAGES.filter((s) => s !== 'Entregado');

function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrderTracker({ order, loading, error, onApproveQuote }: OrderTrackerProps) {
  const [approving, setApproving] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-36 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-lg font-semibold text-slate-900">
          No encontramos esa orden
        </p>
        <p className="mt-1 text-sm text-slate-600">{error}</p>
        <p className="mt-3 text-xs text-slate-500">
          Prueba con las placas de demostración: ABC-123-A, XYZ-894-B, MNO-452-C o JKL-771-D.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-lg font-semibold text-slate-900">
          Ingresa tus placas o folio para ver el avance
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Podrás revisar el diagnóstico técnico, aprobar cotizaciones y confirmar tu hora de entrega.
        </p>
      </div>
    );
  }

  const currentIndex =
    order.status === 'Entregado'
      ? PROGRESS_STAGES.length - 1
      : PROGRESS_STAGES.indexOf(order.status);

  const totalAmount = order.items.reduce((sum, item) => sum + item.price, 0);
  const pendingApproval =
    order.status === 'Esperando Aprobación' || order.items.some((i) => !i.approved);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApproveQuote(order.id);
    } finally {
      setApproving(false);
    }
  };

  return (
    <section
      aria-label="Seguimiento de orden vehicular"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Header summary */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span className="font-semibold text-slate-800">Folio {order.folio}</span>
              <span aria-hidden="true">·</span>
              <span>Placas {order.plate}</span>
              <span aria-hidden="true">·</span>
              <span>{order.mileage.toLocaleString('es-MX')} km</span>
              <span aria-hidden="true">·</span>
              <span>Ingreso {order.entryDate}</span>
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-bold text-slate-950">
              {order.vehicle} ({order.year})
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {order.clientName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {order.mechanic}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {order.bay}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusLabel status={order.status} />
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Entrega: {order.estimatedDelivery}</span>
            </div>
          </div>
        </div>

        {/* 6-step pipeline progress */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {PROGRESS_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentIndex || order.status === 'Entregado';
              const isCurrent = idx === currentIndex && order.status !== 'Entregado';
              return (
                <div key={stage} className="flex flex-col gap-1.5">
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600'
                        : isCurrent
                          ? 'bg-orange-600'
                          : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[11px] leading-tight ${
                      isCurrent
                        ? 'font-semibold text-slate-950'
                        : isCompleted
                          ? 'font-medium text-emerald-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Diagnostic & Symptom */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="p-6">
          <p className="text-xs font-semibold text-slate-500">Motivo de ingreso reportado</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{order.clientSymptom}</p>
        </div>
        <div className="p-6 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500">Diagnóstico técnico del taller</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{order.diagnosticNotes}</p>
        </div>
      </div>

      {/* Quote breakdown */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-950">
              Desglose de presupuesto y trabajos
            </h3>
            <p className="text-xs text-slate-500">
              Precios transparentes en pesos mexicanos (IVA incluido)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Total estimado</span>
            <p className="font-mono text-xl font-bold text-slate-950 tabular-nums">
              {formatMXN(totalAmount)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-4 font-medium">Concepto</th>
                <th className="py-2 px-3 font-medium">Tipo</th>
                <th className="py-2 px-3 font-medium">Autorización</th>
                <th className="py-2 pl-3 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 pr-4 text-slate-800">{item.description}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                    {item.approved ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Autorizado
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700">Pendiente</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                    {item.price === 0 ? 'Cortesía' : formatMXN(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingApproval && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Tu presupuesto está listo para autorización
              </p>
              <p className="text-xs text-amber-800">
                Al autorizar, el mecánico asignado comenzará la reparación de inmediato.
              </p>
            </div>
            <button
              type="button"
              disabled={approving}
              onClick={handleApprove}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {approving ? 'Autorizando...' : `Autorizar ${formatMXN(totalAmount)}`}
            </button>
          </div>
        )}
      </div>

      {/* Chronological timeline */}
      <div className="p-6">
        <h3 className="font-display text-sm font-bold text-slate-950 mb-3">
          Bitácora del vehículo
        </h3>
        <ol className="space-y-3">
          {[...order.timeline].reverse().map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{entry.stage}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.author}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-700">{entry.note}</p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                {entry.timestamp}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
