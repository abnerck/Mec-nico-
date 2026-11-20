import { useState, useEffect } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import type { ServiceCatalogItem } from '../types/workshop';

interface BookingModalProps {
  open: boolean;
  services: ServiceCatalogItem[];
  preselectedService?: string;
  onClose: () => void;
  onCreateAppointment: (payload: {
    clientName: string;
    clientPhone: string;
    plate: string;
    vehicle: string;
    serviceName: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  }) => Promise<void>;
}

export function BookingModal({
  open,
  services,
  preselectedService,
  onClose,
  onCreateAppointment,
}: BookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [serviceName, setServiceName] = useState(
    preselectedService || services[0]?.name || 'Afinación Mayor Completa'
  );
  const [preferredDate, setPreferredDate] = useState('2026-11-20');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedService) {
      setServiceName(preselectedService);
    }
  }, [preselectedService]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreateAppointment({
        clientName,
        clientPhone,
        plate: plate || 'POR-DEFINIR',
        vehicle,
        serviceName,
        preferredDate,
        preferredTime,
        notes,
      });
      setClientName('');
      setClientPhone('');
      setPlate('');
      setVehicle('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h2 id="booking-modal-title" className="font-display text-lg font-bold text-slate-950">
              Agendar cita en taller
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Laura Hernández"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="5512345678"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehículo y año
              </label>
              <input
                type="text"
                required
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ej. Chevrolet Aveo 2020"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Placas (opcional)
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ej. UVW-512-G"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm uppercase focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Servicio solicitado
            </label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-orange-500 focus:outline-none"
            >
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
              <option value="Revisión General / Falla Específica">
                Revisión General / Falla Específica
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha preferida
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora preferida
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm focus:border-orange-500 focus:outline-none"
              >
                {['08:30', '09:30', '10:00', '11:30', '13:00', '15:30', '17:00'].map((t) => (
                  <option key={t} value={t}>
                    {t} hrs
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Síntomas o comentarios (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Hace ruido al dar vuelta a la izquierda..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Agendando...' : 'Confirmar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
