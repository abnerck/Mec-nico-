import { Check, Clock, Wrench } from 'lucide-react';
import type { ServiceCatalogItem } from '../types/workshop';

interface ServicesCatalogProps {
  services: ServiceCatalogItem[];
  onBookService: (serviceName: string) => void;
}

function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ServicesCatalog({ services, onBookService }: ServicesCatalogProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-orange-600">
          Catálogo oficial con precios transparentes
        </p>
        <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-slate-950">
          Servicios preventivos y correctivos
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Todos nuestros servicios incluyen inspección visual de 21 puntos y garantía escrita por 6 meses o 10,000 km.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <article
            key={srv.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div>
              {srv.imageUrl ? (
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/70 p-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Wrench className="h-8 w-8 text-slate-500" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-600">{srv.category}</span>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{srv.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {srv.duration}
                  </span>
                </div>

                <h2 className="mt-1.5 font-display text-xl font-bold text-slate-950">
                  {srv.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {srv.description}
                </p>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {srv.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
              <div>
                <span className="block text-[11px] text-slate-500">Desde / Hasta</span>
                <span className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                  {formatMXN(srv.priceFrom)} – {formatMXN(srv.priceTo)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onBookService(srv.name)}
                className="rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 whitespace-nowrap shrink-0"
              >
                Agendar servicio
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
