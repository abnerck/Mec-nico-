export type OrderStatus =
  | 'Recibido'
  | 'En Diagnóstico'
  | 'Esperando Aprobación'
  | 'En Reparación'
  | 'Pruebas Finales'
  | 'Listo para Entrega'
  | 'Entregado';

export const ORDER_STAGES: OrderStatus[] = [
  'Recibido',
  'En Diagnóstico',
  'Esperando Aprobación',
  'En Reparación',
  'Pruebas Finales',
  'Listo para Entrega',
  'Entregado',
];

export interface QuoteItem {
  id: string;
  description: string;
  category: 'Mano de Obra' | 'Refacción';
  price: number;
  approved: boolean;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  stage: OrderStatus;
  note: string;
  author: string;
}

export interface RepairOrder {
  id: string;
  folio: string;
  plate: string;
  vehicle: string;
  year: number;
  mileage: number;
  clientName: string;
  clientPhone: string;
  status: OrderStatus;
  mechanic: string;
  bay: string;
  entryDate: string;
  estimatedDelivery: string;
  clientSymptom: string;
  diagnosticNotes: string;
  items: QuoteItem[];
  timeline: TimelineEntry[];
  paymentStatus: 'Pendiente' | 'Pagado';
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  priceFrom: number;
  priceTo: number;
  duration: string;
  description: string;
  includes: string[];
  imageUrl?: string;
}

export interface WorkshopAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  plate: string;
  vehicle: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: 'Confirmada' | 'Pendiente' | 'Convertida a Orden' | 'Cancelada';
  createdAt: string;
}

export interface WorkshopInfo {
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  warranty: string;
  paymentMethods: string[];
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imagePreview?: string;
  relatedOrder?: RepairOrder | null;
  createdAppointment?: WorkshopAppointment | null;
  toolsUsed?: string[];
}
