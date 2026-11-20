import { useRef, useState } from 'react';
import { ImagePlus, Send, X, ArrowUpRight, CalendarCheck } from 'lucide-react';
import type { AssistantMessage, RepairOrder } from '../types/workshop';

interface WorkshopAssistantProps {
  onSelectOrderFromChat: (order: RepairOrder) => void;
  onDataMutated: () => void;
}

const INITIAL_MESSAGE: AssistantMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  text: '¡Hola! Soy Don Chema, tu asesor digital del Taller El Pueblito. Puedes preguntarme por el estado de tu coche (con placas o folio), precios de afinación o frenos, enviarme foto de algún testigo en el tablero o pedirme que agende tu cita.',
  timestamp: 'Ahora',
};

const QUICK_PROMPTS = [
  '¿Cómo va mi coche ABC-123-A?',
  '¿Cuánto cuesta la afinación mayor?',
  'Mi carro rechina al frenar',
  'Quiero agendar una cita',
];

export function WorkshopAssistant({
  onSelectOrderFromChat,
  onDataMutated,
}: WorkshopAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const [meta, base64] = dataUrl.split(',');
      const mimeMatch = meta?.match(/data:([^;]+);/);
      if (base64) {
        setAttachedImage({
          base64,
          mimeType: mimeMatch?.[1] || file.type || 'image/jpeg',
          previewUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? input).trim();
    if ((!textToSend && !attachedImage) || sending) return;

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend || 'Adjunto fotografía para diagnóstico.',
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      imagePreview: attachedImage?.previewUrl,
    };

    const currentHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    const imagePayload = attachedImage
      ? { imageBase64: attachedImage.base64, imageMimeType: attachedImage.mimeType }
      : {};

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setAttachedImage(null);
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory,
          message: textToSend,
          ...imagePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al consultar al asistente.');
      }

      const assistantMsg: AssistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        relatedOrder: data.relatedOrder ?? null,
        createdAppointment: data.createdAppointment ?? null,
        toolsUsed: Array.isArray(data.toolsUsed) ? data.toolsUsed : [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.relatedOrder) {
        onSelectOrderFromChat(data.relatedOrder);
      }
      if (data.createdAppointment || (data.toolsUsed ?? []).includes('aprobarCotizacionOrden')) {
        onDataMutated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con el asistente.');
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 60);
    }
  };

  return (
    <aside
      aria-label="Asistente mecánico inteligente"
      className="flex h-[680px] flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Assistant header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 bg-slate-950 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/src/assets/images/mechanic_chief_avatar_1795154049642.jpg"
            alt="Don Chema, asesor del taller"
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-lg object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold truncate">
              Asistente Don Chema
            </h2>
            <p className="text-xs text-slate-300 truncate">
              Consultas de placas, precios y citas · Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={sending}
            onClick={() => sendMessage(q)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-orange-300 hover:text-orange-700 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message stream */}
      <div ref={scrollContainerRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="Imagen adjunta del vehículo"
                    className="mb-2.5 max-h-44 w-full rounded-lg object-cover"
                  />
                )}
                <p>{msg.text}</p>

                {/* Grounded order shortcut */}
                {msg.relatedOrder && (
                  <button
                    type="button"
                    onClick={() => onSelectOrderFromChat(msg.relatedOrder!)}
                    className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-900 transition-colors hover:border-orange-400"
                  >
                    <span className="truncate">
                      Ver orden {msg.relatedOrder.folio} · {msg.relatedOrder.plate} ({msg.relatedOrder.status})
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-orange-600 shrink-0" aria-hidden="true" />
                  </button>
                )}

                {/* Created appointment confirmation */}
                {msg.createdAppointment && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CalendarCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                      <span>Cita registrada · {msg.createdAppointment.id}</span>
                    </div>
                    <p className="mt-1 text-emerald-800">
                      {msg.createdAppointment.serviceName} — {msg.createdAppointment.preferredDate} a las{' '}
                      {msg.createdAppointment.preferredTime}
                    </p>
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[11px] text-slate-400 tabular-nums">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Consultando información del taller...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-slate-200 bg-white p-3.5"
      >
        {attachedImage && (
          <div className="mb-2.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2.5">
              <img
                src={attachedImage.previewUrl}
                alt="Vista previa adjunta"
                className="h-10 w-10 rounded object-cover"
              />
              <span className="text-xs font-medium text-slate-700">
                Foto lista para diagnóstico visual
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              aria-label="Quitar imagen"
              className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Subir foto de testigo o pieza"
            aria-label="Subir foto de testigo o pieza"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta por tu placa, precios o agenda cita..."
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && !attachedImage)}
            aria-label="Enviar mensaje"
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50 shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </form>
    </aside>
  );
}
