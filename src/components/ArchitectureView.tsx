import { Database, Cpu, ShieldCheck, Layers, MessageSquareText, Smartphone } from 'lucide-react';

export function ArchitectureView() {
  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-xs font-semibold text-orange-600">
          Arquitectura técnica explicada paso a paso
        </p>
        <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-slate-950">
          Cómo funciona este sistema para taller mecánico con LLM gratuito
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Igual que los asistentes modernos de atención a clientes (como el de una pozolería o restaurante que consulta menú, horarios y pedidos), este sistema conecta un modelo de lenguaje gratuito de Google (<span className="font-mono text-sm text-slate-900">gemini-4-hydrogen</span>) directamente con la base de datos real del taller mediante <strong>Function Calling</strong> para nunca inventar precios ni estados de reparación.
        </p>
      </div>

      {/* 4 architectural pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Cpu className="h-6 w-6 text-orange-600" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-950">
            01. LLM gratuito con herramientas reales (Gemini API)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            El servidor en Node.js / Express se comunica con <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">gemini-4-hydrogen</span> (incluido en la capa gratuita de Google AI Studio) usando 5 herramientas declaradas: consultar orden por placas, listar catálogo de servicios, agendar citas, aprobar presupuestos y consultar horarios.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Database className="h-6 w-6 text-orange-600" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-950">
            02. Base de datos única para cliente, mecánico e IA
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Todas las órdenes de servicio, diagnósticos, partidas de refacciones y citas viven en una sola fuente de verdad. Cuando el mecánico cambia un coche de &ldquo;En Diagnóstico&rdquo; a &ldquo;Listo para Entrega&rdquo; en el Tablero Taller, el cliente y el asistente Don Chema ven el cambio al instante.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <MessageSquareText className="h-6 w-6 text-orange-600" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-950">
            03. Diagnóstico multimodal por fotografía
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Los clientes pueden subir una foto de un testigo encendido en el tablero, una llanta desgastada o una fuga. Gemini analiza la imagen, explica qué significa con lenguaje sencillo y recomienda el servicio adecuado del taller.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Smartphone className="h-6 w-6 text-orange-600" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-950">
            04. Cómo conectarlo a WhatsApp o escalar a la nube
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Este mismo endpoint <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">POST /api/assistant/chat</span> puede conectarse a un webhook de WhatsApp Business (Meta Cloud API o Twilio) y migrar el almacenamiento local a PostgreSQL (Cloud SQL) o Firebase Firestore cuando el taller crezca a varias sucursales.
          </p>
        </div>
      </div>

      {/* Flow diagram in structured table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-orange-600" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-slate-950">
            Flujo de una consulta real: &ldquo;¿Cómo va mi coche ABC-123-A?&rdquo;
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              step: 'Paso 1 · Cliente',
              detail: 'El dueño escribe en el chat web (o WhatsApp) preguntando por sus placas ABC-123-A.',
            },
            {
              step: 'Paso 2 · Servidor Express',
              detail: 'Envía el mensaje a Gemini junto con las definiciones de herramientas (FunctionDeclarations) del taller.',
            },
            {
              step: 'Paso 3 · Tool Call',
              detail: 'Gemini detecta la placa y solicita ejecutar consultarOrdenVehiculo({ busqueda: "ABC-123-A" }).',
            },
            {
              step: 'Paso 4 · Consulta DB',
              detail: 'El servidor consulta la base de datos real, obtiene etapa, diagnóstico, partidas en MXN y entrega estimada.',
            },
            {
              step: 'Paso 5 · Respuesta Clara',
              detail: 'Gemini redacta una respuesta humana con los datos exactos y ofrece botón directo para autorizar el presupuesto.',
            },
          ].map((row) => (
            <div key={row.step} className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-6 py-4 text-sm">
              <div className="sm:col-span-3 font-mono text-xs font-semibold text-slate-900">
                {row.step}
              </div>
              <div className="sm:col-span-9 text-slate-700">{row.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100/70 p-5 text-sm text-slate-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
        <p>
          <strong>Seguridad incluida:</strong> La clave de Gemini (<span className="font-mono text-xs">GEMINI_API_KEY</span>) vive únicamente en el servidor Express y nunca se expone al navegador del cliente.
        </p>
      </div>
    </div>
  );
}
