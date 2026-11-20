import { useEffect, useState } from 'react';
import { Plus, Search, Wrench, Calendar, ArrowRight } from 'lucide-react';
import {
  ORDER_STAGES,
  type OrderStatus,
  type RepairOrder,
  type WorkshopAppointment,
} from '../types/workshop';
import { StatusLabel } from './StatusLabel';

interface WorkshopBoardProps {
  orders: RepairOrder[];
  appointments: WorkshopAppointment[];
  onOpenNewOrder: () => void;
  onUpdateOrder: (
    id: string,
    patch: {
      status?: OrderStatus;
      diagnosticNotes?: string;
      mechanic?: string;
      bay?: string;
      estimatedDelivery?: string;
      paymentStatus?: 'Pendiente' | 'Pagado';
      timelineNote?: string;
    }
  ) => Promise<void>;
  onAddOrderItem: (
    id: string,
    item: { description: string; category: 'Mano de Obra' | 'Refacción'; price: number }
  ) => Promise<void>;
  onConvertAppointment: (appt: WorkshopAppointment) => Promise<void>;
  onUpdateAppointmentStatus: (
    id: string,
    status: WorkshopAppointment['status']
  ) => Promise<void>;
}

function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function WorkshopBoard({
  orders,
  appointments,
  onOpenNewOrder,
  onUpdateOrder,
  onAddOrderItem,
  onConvertAppointment,
  onUpdateAppointmentStatus,
}: WorkshopBoardProps) {
  const [filterStatus, setFilterStatus] = useState<'Todas' | OrderStatus>('Todas');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string>(orders[0]?.id ?? '');

  // Editable workbench fields
  const activeOrder = orders.find((o) => o.id === activeId) ?? orders[0] ?? null;

  const [newStatus, setNewStatus] = useState<OrderStatus>('Recibido');
  const [diagDraft, setDiagDraft] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [itemDesc, setItemDesc] = useState('');
  const [itemCat, setItemCat] = useState<'Mano de Obra' | 'Refacción'>('Refacción');
  const [itemPrice, setItemPrice] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    if (activeOrder) {
      setNewStatus(activeOrder.status);
      setDiagDraft(activeOrder.diagnosticNotes);
    }
  }, [activeOrder?.id, activeOrder?.status, activeOrder?.diagnosticNotes]);

  const selectOrder = (order: RepairOrder) => {
    setActiveId(order.id);
    setNewStatus(order.status);
    setDiagDraft(order.diagnosticNotes);
    setTimelineNote('');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'Todas' || o.status === filterStatus;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.plate.toLowerCase().includes(q) ||
      o.folio.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.vehicle.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleSaveOrderChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSaving(true);
    try {
      await onUpdateOrder(activeOrder.id, {
        status: newStatus,
        diagnosticNotes: diagDraft,
        timelineNote: timelineNote.trim() || undefined,
      });
      setTimelineNote('');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !itemDesc.trim()) return;
    setAddingItem(true);
    try {
      await onAddOrderItem(activeOrder.id, {
        description: itemDesc.trim(),
        category: itemCat,
        price: Number(itemPrice) || 0,
      });
      setItemDesc('');
      setItemPrice('');
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
            Tablero operativo del taller
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Actualiza etapas en vivo, registra diagnósticos y gestiona refacciones. Los cambios se reflejan al instante en el Portal Cliente y el asistente IA.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva orden de ingreso
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1">
          {(['Todas', 'Recibido', 'En Diagnóstico', 'Esperando Aprobación', 'En Reparación', 'Listo para Entrega'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  filterStatus === tab
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por placa, folio o cliente..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Grid + Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-display text-base font-semibold text-slate-900">
                No hay órdenes con ese filtro
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Limpia la búsqueda o registra una nueva unidad en taller.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                    <th className="py-3 pl-5 pr-3 font-semibold">Folio / Placa</th>
                    <th className="py-3 px-3 font-semibold">Vehículo y Cliente</th>
                    <th className="py-3 px-3 font-semibold">Estado</th>
                    <th className="py-3 pl-3 pr-5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const total = order.items.reduce((s, i) => s + i.price, 0);
                    const isSelected = activeOrder?.id === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => selectOrder(order)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 pl-5 pr-3 align-top whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-slate-950 tabular-nums">
                            {order.folio}
                          </div>
                          <div className="font-mono text-xs text-slate-500 tabular-nums">
                            {order.plate}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <div className="font-medium text-slate-950">
                            {order.vehicle} ({order.year})
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.clientName} · {order.bay}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <StatusLabel status={order.status} />
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-right align-top font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatMXN(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mechanic Workbench */}
        <div className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          {activeOrder ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                    {activeOrder.folio} · {activeOrder.plate}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
                    {activeOrder.vehicle}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeOrder.clientName} · Tel: {activeOrder.clientPhone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateOrder(activeOrder.id, {
                      paymentStatus:
                        activeOrder.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado',
                    })
                  }
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    activeOrder.paymentStatus === 'Pagado'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Pago: {activeOrder.paymentStatus}
                </button>
              </div>

              {/* Update stage & diagnostic */}
              <form onSubmit={handleSaveOrderChanges} className="space-y-4">
                <div>
                  <label htmlFor="stage-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Etapa actual en taller
                  </label>
                  <select
                    id="stage-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    {ORDER_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="diag-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Notas de diagnóstico técnico
                  </label>
                  <textarea
                    id="diag-notes"
                    rows={3}
                    value={diagDraft}
                    onChange={(e) => setDiagDraft(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="timeline-note" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nota nueva para bitácora del cliente (opcional)
                  </label>
                  <input
                    id="timeline-note"
                    type="text"
                    value={timelineNote}
                    onChange={(e) => setTimelineNote(e.target.value)}
                    placeholder="Ej. Refacción instalada, iniciando prueba en ruta..."
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                >
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Guardando actualización...' : 'Guardar avance en bitácora'}
                </button>
              </form>

              {/* Add item to quote */}
              <form
                onSubmit={handleAddItem}
                className="border-t border-slate-200 pt-5 space-y-3"
              >
                <p className="text-xs font-semibold text-slate-700">
                  Agregar concepto o refacción al presupuesto
                </p>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Descripción (ej. Cambio de sensor O2)"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={itemCat}
                    onChange={(e) => setItemCat(e.target.value as 'Mano de Obra' | 'Refacción')}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Refacción">Refacción</option>
                    <option value="Mano de Obra">Mano de Obra</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="Precio MXN"
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingItem || !itemDesc.trim()}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  {addingItem ? 'Agregando...' : 'Agregar partida al presupuesto'}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Selecciona una orden de la tabla para editar su avance.
            </p>
          )}
        </div>
      </div>

      {/* Appointments Queue */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-950">
              Citas agendadas (Portal y Asistente IA)
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {appointments.length} registradas
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900">{appt.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {appt.preferredDate} {appt.preferredTime}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{appt.plate}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {appt.clientName} — {appt.vehicle}
                </p>
                <p className="text-xs text-slate-600">
                  {appt.serviceName} · Tel: {appt.clientPhone}
                  {appt.notes ? ` · "${appt.notes}"` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {appt.status}
                </span>
                {appt.status !== 'Convertida a Orden' && (
                  <>
                    {appt.status === 'Pendiente' && (
                      <button
                        type="button"
                        onClick={() => onUpdateAppointmentStatus(appt.id, 'Confirmada')}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onConvertAppointment(appt)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      <span>Ingresar a taller</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
