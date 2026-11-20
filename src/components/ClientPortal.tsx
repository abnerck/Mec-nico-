import { useState } from 'react';
import { Search, ShieldCheck, Clock, MapPin } from 'lucide-react';
import type { RepairOrder, WorkshopInfo } from '../types/workshop';
import { OrderTracker } from './OrderTracker';
import { WorkshopAssistant } from './WorkshopAssistant';

interface ClientPortalProps {
  orders: RepairOrder[];
  info: WorkshopInfo | null;
  selectedOrder: RepairOrder | null;
  lookupLoading: boolean;
  lookupError: string | null;
  onLookup: (query: string) => Promise<void>;
  onSelectOrder: (order: RepairOrder) => void;
  onApproveQuote: (orderId: string) => Promise<void>;
  onDataMutated: () => void;
}

const DEMO_SHORTCUTS = [
  { label: 'ABC-123-A · Jetta', query: 'ABC-123-A' },
  { label: 'XYZ-894-B · Versa', query: 'XYZ-894-B' },
  { label: 'MNO-452-C · CR-V', query: 'MNO-452-C' },
  { label: 'JKL-771-D · Mazda 3', query: 'JKL-771-D' },
];

export function ClientPortal({
  orders,
  info,
  selectedOrder,
  lookupLoading,
  lookupError,
  onLookup,
  onSelectOrder,
  onApproveQuote,
  onDataMutated,
}: ClientPortalProps) {
  const [searchText, setSearchText] = useState(selectedOrder?.plate ?? 'ABC-123-A');

  const activeCount = orders.filter((o) => o.status !== 'Entregado').length;
  const readyCount = orders.filter((o) => o.status === 'Listo para Entrega').length;
  const pendingApprovalCount = orders.filter((o) => o.status === 'Esperando Aprobación').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLookup(searchText);
  };

  return (
    <div className="space-y-8">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold text-orange-600">
              Portal de seguimiento vehicular · Taller El Pueblito
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-950 leading-[1.12]">
              Consulta el estado de tu coche al instante
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              Revisa en tiempo real en qué bahía está tu vehículo, lee el diagnóstico del mecánico, autoriza presupuestos sin llamadas y pregúntale cualquier duda a nuestro asesor inteligente.
            </p>

            {/* Plate / Folio search */}
            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="plate-lookup" className="block text-xs font-semibold text-slate-700 mb-2">
                Busca por placas, folio de orden o teléfono
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="plate-lookup"
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Ej. ABC-123-A o EP-041"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 font-mono text-sm text-slate-950 placeholder:font-sans placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {lookupLoading ? 'Buscando...' : 'Consultar Estado'}
                </button>
              </div>
            </form>

            {/* Quick demo buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Órdenes activas de ejemplo:</span>
              {DEMO_SHORTCUTS.map((item) => (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => {
                    setSearchText(item.query);
                    onLookup(item.query);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 whitespace-nowrap shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              {info?.hours ?? 'Lun–Sáb 8:00 a 19:00 hrs'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              Garantía 6 meses / 10,000 km
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              {info?.phone ?? '(55) 4820-9134'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <img
            src="/src/assets/images/workshop_hero_bay_1795154050528.jpg"
            alt="Bahía principal de Taller Mecánico El Pueblito con vehículo en elevador"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover lg:h-full"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/images/mechanic_chief_avatar_1795154049642.jpg"
                alt="Maestro Hernán Morales"
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-lg object-cover border border-white/25 shrink-0"
              />
              <div>
                <p className="text-sm font-semibold">Maestro Hernán Morales</p>
                <p className="text-xs text-slate-300">
                  Jefe de taller · 18 años en diagnóstico y mecánica automotriz
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width 4-column KPI strip */}
      <section
        aria-label="Indicadores del taller"
        className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Vehículos actualmente en taller</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-950 tabular-nums">
            {activeCount} unidades
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Listos para entrega hoy</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {readyCount} unidades
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Esperando autorización</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {pendingApprovalCount} órdenes
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Diagnóstico inicial OBD-II</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-950 tabular-nums">
            45 min
          </p>
        </div>
      </section>

      {/* Main 2-column workspace: Live Order Tracker + Free Gemini AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <OrderTracker
            order={selectedOrder}
            loading={lookupLoading}
            error={lookupError}
            onApproveQuote={onApproveQuote}
          />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <WorkshopAssistant
            onSelectOrderFromChat={(order) => {
              setSearchText(order.plate);
              onSelectOrder(order);
            }}
            onDataMutated={onDataMutated}
          />
        </div>
      </div>
    </div>
  );
}
