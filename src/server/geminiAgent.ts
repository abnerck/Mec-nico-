import { FunctionDeclaration, GoogleGenAI, Type, type Content, type Part } from '@google/genai';
import {
  approveOrderQuote,
  createAppointment,
  getWorkshopInfo,
  listServices,
  lookupOrder,
} from './workshopDb.ts';
import type { RepairOrder, WorkshopAppointment } from '../types/workshop.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const consultarOrdenDeclaration: FunctionDeclaration = {
  name: 'consultarOrdenVehiculo',
  description:
    'Busca el estado real, diagnóstico, cotización, mecánico asignado, fecha estimada de entrega e historial de un vehículo en el taller usando placas, folio (ej. EP-041) o teléfono del cliente.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      busqueda: {
        type: Type.STRING,
        description: 'Placa del coche (ej. ABC-123-A), folio de orden (ej. EP-041) o teléfono del cliente.',
      },
    },
    required: ['busqueda'],
  },
};

const listarServiciosDeclaration: FunctionDeclaration = {
  name: 'listarServiciosTaller',
  description:
    'Obtiene el catálogo oficial de servicios del taller con rangos de precios en pesos mexicanos, duración estimada y qué incluye cada paquete.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      categoria: {
        type: Type.STRING,
        description: 'Filtro opcional de categoría o palabra clave (ej. frenos, afinación, escáner, aceite, suspensión).',
      },
    },
  },
};

const agendarCitaDeclaration: FunctionDeclaration = {
  name: 'agendarCitaTaller',
  description:
    'Agenda una cita real en el sistema del taller mecánico. Úsala únicamente cuando ya tengas nombre del cliente, teléfono, vehículo, servicio deseado y fecha/hora preferida.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientName: { type: Type.STRING, description: 'Nombre completo del cliente.' },
      clientPhone: { type: Type.STRING, description: 'Número de teléfono o WhatsApp.' },
      plate: { type: Type.STRING, description: 'Placas del vehículo (si no las sabe, usar POR-DEFINIR).' },
      vehicle: { type: Type.STRING, description: 'Marca, modelo y año del vehículo.' },
      serviceName: { type: Type.STRING, description: 'Servicio o revisión solicitada.' },
      preferredDate: { type: Type.STRING, description: 'Fecha preferida en formato YYYY-MM-DD o texto claro.' },
      preferredTime: { type: Type.STRING, description: 'Hora preferida (ej. 10:00).' },
      notes: { type: Type.STRING, description: 'Síntomas o notas adicionales del cliente.' },
    },
    required: ['clientName', 'clientPhone', 'vehicle', 'serviceName', 'preferredDate', 'preferredTime'],
  },
};

const aprobarCotizacionDeclaration: FunctionDeclaration = {
  name: 'aprobarCotizacionOrden',
  description:
    'Autoriza el presupuesto pendiente de una orden de reparación cuando el cliente confirma explícitamente que desea aprobarlo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      identificador: {
        type: Type.STRING,
        description: 'Folio (ej. EP-041) o placas (ej. ABC-123-A) de la orden a autorizar.',
      },
    },
    required: ['identificador'],
  },
};

const obtenerInfoTallerDeclaration: FunctionDeclaration = {
  name: 'obtenerHorariosYUbicacion',
  description: 'Devuelve dirección, horarios, teléfonos, política de garantía y métodos de pago del Taller Mecánico El Pueblito.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const WORKSHOP_TOOLS = [
  {
    functionDeclarations: [
      consultarOrdenDeclaration,
      listarServiciosDeclaration,
      agendarCitaDeclaration,
      aprobarCotizacionDeclaration,
      obtenerInfoTallerDeclaration,
    ],
  },
];

const SYSTEM_INSTRUCTION = `Eres "Don Chema", el asesor mecánico digital de "Taller Mecánico El Pueblito".
Tu trato es cálido, honesto, claro y muy profesional (español de México, cercano pero sin exagerar modismos).

REGLAS CRÍTICAS:
1. NUNCA inventes estados de vehículos, precios ni disponibilidad. SIEMPRE llama a las herramientas proporcionadas para consultar órdenes reales (\`consultarOrdenVehiculo\`), precios de servicios (\`listarServiciosTaller\`), horarios (\`obtenerHorariosYUbicacion\`), o agendar citas (\`agendarCitaTaller\`).
2. Si el cliente pregunta por el estado de su coche sin dar placas, folio o teléfono, pídele amablemente su número de placas (ej. ABC-123-A) o folio (ej. EP-041).
3. Cuando muestres una orden encontrada, resume claramente: vehículo, etapa actual, diagnóstico del mecánico, total cotizado (en MXN) y entrega estimada. Si está en "Esperando Aprobación", pregúntale si desea autorizar el presupuesto para iniciar la reparación de inmediato.
4. Solo llama a \`aprobarCotizacionOrden\` si el cliente expresa claramente que autoriza/aprueba el presupuesto.
5. Si el cliente envía una foto (por ejemplo de un testigo en el tablero, llanta, disco de freno o fuga), analiza visualmente la imagen con precisión técnica, explica posibles causas, nivel de urgencia para circular y sugiere el servicio adecuado del catálogo.
6. Mantén respuestas claras, escaneables (viñetas cortas cuando listes partidas o pasos) y concisas.`;

export interface ChatTurnInput {
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ChatTurnResult {
  reply: string;
  relatedOrder: RepairOrder | null;
  createdAppointment: WorkshopAppointment | null;
  toolsUsed: string[];
}

export async function runWorkshopAssistant(input: ChatTurnInput): Promise<ChatTurnResult> {
  const ai = getAiClient();

  const contents: Content[] = input.history
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

  const currentParts: Part[] = [];
  if (input.imageBase64 && input.imageMimeType) {
    currentParts.push({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.imageMimeType,
      },
    });
  }
  currentParts.push({
    text: input.message.trim() || 'Por favor analiza esta imagen relacionada con mi vehículo.',
  });

  contents.push({ role: 'user', parts: currentParts });

  let relatedOrder: RepairOrder | null = null;
  let createdAppointment: WorkshopAppointment | null = null;
  const toolsUsed: string[] = [];

  let response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: WORKSHOP_TOOLS,
    },
  });

  // Execute up to 4 rounds of tool calls if needed
  let rounds = 0;
  while (response.functionCalls && response.functionCalls.length > 0 && rounds < 4) {
    rounds += 1;
    const modelContent = response.candidates?.[0]?.content;
    if (!modelContent) break;

    contents.push(modelContent);

    const functionResponseParts: Part[] = [];
    for (const call of response.functionCalls) {
      const name = call.name ?? '';
      const args = (call.args ?? {}) as Record<string, unknown>;
      toolsUsed.push(name);

      let resultPayload: unknown = { error: 'Herramienta desconocida' };

      if (name === 'consultarOrdenVehiculo') {
        const busqueda = String(args.busqueda ?? '');
        const found = lookupOrder(busqueda);
        if (found) {
          relatedOrder = found;
          const total = found.items.reduce((acc, item) => acc + item.price, 0);
          resultPayload = {
            encontrada: true,
            orden: { ...found, totalCotizadoMXN: total },
          };
        } else {
          resultPayload = {
            encontrada: false,
            mensaje: `No se encontró ninguna orden con "${busqueda}". Verifica placas o folio.`,
          };
        }
      } else if (name === 'listarServiciosTaller') {
        const cat = String(args.categoria ?? '').toLowerCase();
        const all = listServices();
        const filtered = cat
          ? all.filter(
              (s) =>
                s.name.toLowerCase().includes(cat) ||
                s.category.toLowerCase().includes(cat) ||
                s.description.toLowerCase().includes(cat)
            )
          : all;
        resultPayload = { servicios: filtered.length > 0 ? filtered : all };
      } else if (name === 'agendarCitaTaller') {
        const appt = createAppointment({
          clientName: String(args.clientName ?? 'Cliente'),
          clientPhone: String(args.clientPhone ?? ''),
          plate: String(args.plate ?? 'POR-DEFINIR'),
          vehicle: String(args.vehicle ?? ''),
          serviceName: String(args.serviceName ?? 'Revisión General'),
          preferredDate: String(args.preferredDate ?? 'Próximo día hábil'),
          preferredTime: String(args.preferredTime ?? '10:00'),
          notes: String(args.notes ?? ''),
        });
        createdAppointment = appt;
        resultPayload = { agendada: true, cita: appt };
      } else if (name === 'aprobarCotizacionOrden') {
        const updated = approveOrderQuote(String(args.identificador ?? ''));
        if (updated) {
          relatedOrder = updated;
          resultPayload = { aprobada: true, orden: updated };
        } else {
          resultPayload = { aprobada: false, mensaje: 'No se encontró la orden para aprobar.' };
        }
      } else if (name === 'obtenerHorariosYUbicacion') {
        resultPayload = { taller: getWorkshopInfo() };
      }

      functionResponseParts.push({
        functionResponse: {
          id: call.id,
          name,
          response: { result: resultPayload },
        },
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });

    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: WORKSHOP_TOOLS,
      },
    });
  }

  return {
    reply:
      response.text?.trim() ||
      'Disculpa, no pude generar una respuesta en este momento. ¿Podrías reformular tu consulta?',
    relatedOrder,
    createdAppointment,
    toolsUsed: Array.from(new Set(toolsUsed)),
  };
}
