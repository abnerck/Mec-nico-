import { useState } from 'react';
import { X, ClipboardPlus } from 'lucide-react';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreateOrder: (payload: {
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
  }) => Promise<void>;
}

export function NewOrderModal({ open, onClose, onCreateOrder }: NewOrderModalProps) {
  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [year, setYear] = useState('2021');
  const [mileage, setMileage] = useState('45000');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [mechanic, setMechanic] = useState('Maestro Hernán Morales');
  const [bay, setBay] = useState('Bahía 1');
  const [estimatedDelivery, setEstimatedDelivery] = useState('Hoy 18:00 hrs');
  const [clientSymptom, setClientSymptom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateOrder({
        plate,
        vehicle,
        year: Number(year) || 2021,
        mileage: Number(mileage) || 0,
        clientName,
        clientPhone,
        mechanic,
        bay,
        estimatedDelivery,
        clientSymptom,
      });
      setPlate('');
      setVehicle('');
      setClientName('');
      setClientPhone('');
      setClientSymptom('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h2 id="new-order-title" className="font-display text-lg font-bold text-slate-950">
              Registrar nuevo ingreso de vehículo
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
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Placas
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ej. GHI-321-H"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm uppercase focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehículo
              </label>
              <input
                type="text"
                required
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ej. Nissan Sentra"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Año
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kilometraje
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del propietario"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="5512345678"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mecánico asignado
              </label>
              <select
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="Maestro Hernán Morales">Maestro Hernán Morales</option>
                <option value="Ing. Ricardo Salinas">Ing. Ricardo Salinas</option>
                <option value="Téc. Luis Ángel Vega">Téc. Luis Ángel Vega</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bahía
              </label>
              <select
                value={bay}
                onChange={(e) => setBay(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="Bahía 1">Bahía 1</option>
                <option value="Bahía 2 (Elevador)">Bahía 2 (Elevador)</option>
                <option value="Bahía 3 (Suspensión)">Bahía 3 (Suspensión)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Entrega estimada
            </label>
            <input
              type="text"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Falla o servicio reportado por el cliente
            </label>
            <textarea
              required
              rows={2}
              value={clientSymptom}
              onChange={(e) => setClientSymptom(e.target.value)}
              placeholder="Ej. Afinación de 60,000 km y revisión de frenos..."
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
              {submitting ? 'Registrando...' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
