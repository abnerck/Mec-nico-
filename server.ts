import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  addOrderItem,
  approveOrderQuote,
  createAppointment,
  createOrder,
  getWorkshopInfo,
  listAppointments,
  listOrders,
  listServices,
  lookupOrder,
  updateAppointmentStatus,
  updateOrder,
} from './src/server/workshopDb.ts';
import { runWorkshopAssistant } from './src/server/geminiAgent.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Workshop metadata & catalog
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/info', (_req, res) => {
    res.json(getWorkshopInfo());
  });

  app.get('/api/services', (_req, res) => {
    res.json(listServices());
  });

  // Repair Orders
  app.get('/api/orders', (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(listOrders(query));
  });

  app.get('/api/orders/lookup', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!q.trim()) {
      res.status(400).json({ error: 'Ingresa una placa, folio o teléfono para consultar.' });
      return;
    }
    const order = lookupOrder(q);
    if (!order) {
      res.status(404).json({ error: `No encontramos una orden activa con "${q.trim()}".` });
      return;
    }
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    const { plate, vehicle, year, mileage, clientName, clientPhone, mechanic, bay, estimatedDelivery, clientSymptom } =
      req.body ?? {};
    if (!plate || !vehicle || !clientName || !clientSymptom) {
      res.status(400).json({ error: 'Faltan campos obligatorios: placas, vehículo, cliente y síntoma.' });
      return;
    }
    const created = createOrder({
      plate,
      vehicle,
      year: Number(year) || 2020,
      mileage: Number(mileage) || 0,
      clientName,
      clientPhone: clientPhone || '',
      mechanic: mechanic || 'Maestro Hernán Morales',
      bay: bay || 'Bahía 1',
      estimatedDelivery: estimatedDelivery || 'Por confirmar',
      clientSymptom,
    });
    res.status(201).json(created);
  });

  app.patch('/api/orders/:id', (req, res) => {
    const updated = updateOrder(req.params.id, req.body ?? {});
    if (!updated) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/orders/:id/items', (req, res) => {
    const { description, category, price, approved } = req.body ?? {};
    if (!description || price === undefined) {
      res.status(400).json({ error: 'La descripción y el precio son obligatorios.' });
      return;
    }
    const updated = addOrderItem(req.params.id, {
      description,
      category: category === 'Refacción' ? 'Refacción' : 'Mano de Obra',
      price: Number(price),
      approved: Boolean(approved),
    });
    if (!updated) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }
    res.json(updated);
  });

  app.patch('/api/orders/:id/approve', (req, res) => {
    const updated = approveOrderQuote(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }
    res.json(updated);
  });

  // Appointments
  app.get('/api/appointments', (_req, res) => {
    res.json(listAppointments());
  });

  app.post('/api/appointments', (req, res) => {
    const { clientName, clientPhone, plate, vehicle, serviceName, preferredDate, preferredTime, notes } = req.body ?? {};
    if (!clientName || !clientPhone || !vehicle || !serviceName || !preferredDate || !preferredTime) {
      res.status(400).json({ error: 'Completa nombre, teléfono, vehículo, servicio, fecha y hora.' });
      return;
    }
    const created = createAppointment({
      clientName,
      clientPhone,
      plate: plate || 'POR-DEFINIR',
      vehicle,
      serviceName,
      preferredDate,
      preferredTime,
      notes,
    });
    res.status(201).json(created);
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const { status } = req.body ?? {};
    if (!status) {
      res.status(400).json({ error: 'Estado requerido.' });
      return;
    }
    const updated = updateAppointmentStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Cita no encontrada.' });
      return;
    }
    res.json(updated);
  });

  // Gemini AI Workshop Assistant
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { history, message, imageBase64, imageMimeType } = req.body ?? {};
      if (!message && !imageBase64) {
        res.status(400).json({ error: 'Escribe una pregunta o adjunta una imagen.' });
        return;
      }
      const result = await runWorkshopAssistant({
        history: Array.isArray(history) ? history : [],
        message: String(message ?? ''),
        imageBase64: typeof imageBase64 === 'string' ? imageBase64 : undefined,
        imageMimeType: typeof imageMimeType === 'string' ? imageMimeType : undefined,
      });
      res.json(result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Assistant error:', errMsg);

      if (errMsg === 'MISSING_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'No se encontró GEMINI_API_KEY configurada en el servidor. Configúrala en Settings > Secrets.',
        });
        return;
      }
      if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('400')) {
        res.status(400).json({
          error: 'Error de autenticación con Gemini API. Verifica tu clave en Settings > Secrets.',
        });
        return;
      }
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        res.status(429).json({
          error: 'Se alcanzó el límite temporal de peticiones gratuitas. Intenta de nuevo en unos segundos.',
        });
        return;
      }
      res.status(500).json({
        error: 'No fue posible procesar la consulta con el asistente en este momento.',
      });
    }
  });

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Taller Mecánico El Pueblito escuchando en http://localhost:${PORT}`);
  });
}

startServer();
