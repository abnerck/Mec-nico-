import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Navbar, type AppTab } from './components/Navbar';
import { ClientPortal } from './components/ClientPortal';
import { WorkshopBoard } from './components/WorkshopBoard';
import { ServicesCatalog } from './components/ServicesCatalog';
import { ArchitectureView } from './components/ArchitectureView';
import { BookingModal } from './components/BookingModal';
import { NewOrderModal } from './components/NewOrderModal';
import type {
  OrderStatus,
  RepairOrder,
  ServiceCatalogItem,
  WorkshopAppointment,
  WorkshopInfo,
} from './types/workshop';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('portal');
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [appointments, setAppointments] = useState<WorkshopAppointment[]>([]);
  const [info, setInfo] = useState<WorkshopInfo | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const fetchAllData = useCallback(async () => {
    try {
      const [ordersRes, servicesRes, apptsRes, infoRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/services'),
        fetch('/api/appointments'),
        fetch('/api/info'),
      ]);

      const [ordersData, servicesData, apptsData, infoData] = await Promise.all([
        ordersRes.json(),
        servicesRes.json(),
        apptsRes.json(),
        infoRes.json(),
      ]);

      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        setSelectedOrder((prev) => {
          if (!prev) return ordersData[0] ?? null;
          return ordersData.find((o) => o.id === prev.id) ?? prev;
        });
      }
      if (Array.isArray(servicesData)) setServices(servicesData);
      if (Array.isArray(apptsData)) setAppointments(apptsData);
      if (infoData && infoData.name) setInfo(infoData);
    } catch (err) {
      console.error('Error loading workshop data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLookup = async (query: string) => {
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setSelectedOrder(null);
        setLookupError(data.error || 'No encontramos esa orden.');
        return;
      }
      setSelectedOrder(data);
    } catch {
      setLookupError('Error de conexión al consultar el vehículo.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleApproveQuote = async (orderId: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/approve`, {
      method: 'PATCH',
    });
    if (res.ok) {
      const updated = (await res.json()) as RepairOrder;
      setSelectedOrder(updated);
      await fetchAllData();
      showToast(`Presupuesto autorizado para ${updated.folio}. El mecánico inició la reparación.`);
    }
  };

  const handleUpdateOrder = async (
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
  ) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await fetchAllData();
      showToast('Orden actualizada correctamente en el sistema.');
    }
  };

  const handleAddOrderItem = async (
    id: string,
    item: { description: string; category: 'Mano de Obra' | 'Refacción'; price: number }
  ) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      await fetchAllData();
      showToast('Concepto agregado al presupuesto de la orden.');
    }
  };

  const handleCreateAppointment = async (payload: {
    clientName: string;
    clientPhone: string;
    plate: string;
    vehicle: string;
    serviceName: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  }) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo registrar la cita.');
    }
    await fetchAllData();
    showToast(`Cita ${data.id} confirmada para ${data.preferredDate} a las ${data.preferredTime} hrs.`);
  };

  const handleCreateOrder = async (payload: {
    plate: string;
    vehicle: string;
    year: number;
    mileage: number;
    clientName: string;
    clientPhone: string;
    mechanic: string;
    bay: string;
    estimatedDelivery: string;
    clientSymptom: string;
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as RepairOrder;
      setSelectedOrder(created);
      await fetchAllData();
      showToast(`Orden ${created.folio} (${created.plate}) ingresada a taller.`);
    }
  };

  const handleUpdateAppointmentStatus = async (
    id: string,
    status: WorkshopAppointment['status']
  ) => {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchAllData();
      showToast(`Cita ${id} actualizada a ${status}.`);
    }
  };

  const handleConvertAppointment = async (appt: WorkshopAppointment) => {
    await handleCreateOrder({
      plate: appt.plate,
      vehicle: appt.vehicle,
      year: 2021,
      mileage: 50000,
      clientName: appt.clientName,
      clientPhone: appt.clientPhone,
      mechanic: 'Maestro Hernán Morales',
      bay: 'Bahía 1',
      estimatedDelivery: 'Hoy 18:00 hrs',
      clientSymptom: `${appt.serviceName}${appt.notes ? ` — ${appt.notes}` : ''}`,
    });
    await handleUpdateAppointmentStatus(appt.id, 'Convertida a Orden');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenBooking={() => {
          setPreselectedService(undefined);
          setBookingOpen(true);
        }}
      />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-8">
        {activeTab === 'portal' && (
          <ClientPortal
            orders={orders}
            info={info}
            selectedOrder={selectedOrder}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
            onLookup={handleLookup}
            onSelectOrder={(order) => {
              setLookupError(null);
              setSelectedOrder(order);
            }}
            onApproveQuote={handleApproveQuote}
            onDataMutated={fetchAllData}
          />
        )}

        {activeTab === 'taller' && (
          <WorkshopBoard
            orders={orders}
            appointments={appointments}
            onOpenNewOrder={() => setNewOrderOpen(true)}
            onUpdateOrder={handleUpdateOrder}
            onAddOrderItem={handleAddOrderItem}
            onConvertAppointment={handleConvertAppointment}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          />
        )}

        {activeTab === 'servicios' && (
          <ServicesCatalog
            services={services}
            onBookService={(srvName) => {
              setPreselectedService(srvName);
              setBookingOpen(true);
            }}
          />
        )}

        {activeTab === 'arquitectura' && <ArchitectureView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:px-8">
          <p>
            {info?.name ?? 'Taller Mecánico El Pueblito'} · {info?.address ?? 'Av. Hidalgo 248'}
          </p>
          <p>
            {info?.hours ?? 'Lun–Sáb 8:00 a 19:00 hrs'} · Tel: {info?.phone ?? '(55) 4820-9134'}
          </p>
        </div>
      </footer>

      <BookingModal
        open={bookingOpen}
        services={services}
        preselectedService={preselectedService}
        onClose={() => setBookingOpen(false)}
        onCreateAppointment={handleCreateAppointment}
      />

      <NewOrderModal
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  );
}
