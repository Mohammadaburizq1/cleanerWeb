import { Injectable } from '@angular/core';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'refunded';

export type Order = {
  id: string;
  createdAt: string; // ISO
  status: OrderStatus;
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyType: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  /** Summary from services page (or from backend e.g. CreateStripePayment) */
  estimatedCost: number | null;
  currency: string;
  propertyLabel: string;
};

/** Example orders for UI demo. Replace with backend API (e.g. CreateStripePayment) when ready. */
function createSampleOrders(): Order[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => d.toISOString();
  return [
    {
      id: 'order-demo-1',
      createdAt: iso(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      status: 'pending',
      fullName: 'Sarah Johnson',
      phone: '+962 79 123 4567',
      email: 'sarah.j@example.com',
      serviceType: 'residential',
      propertyType: 'apartment',
      address: '123 Garden St, Amman',
      preferredDate: '2025-03-20',
      preferredTime: '10:00',
      notes: 'Please use eco-friendly products.',
      estimatedCost: 85,
      currency: 'JD',
      propertyLabel: 'Two Bedroom Home · 1 Bathroom',
    },
    {
      id: 'order-demo-2',
      createdAt: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      status: 'accepted',
      fullName: 'Ahmed Hassan',
      phone: '+962 77 555 1234',
      email: 'ahmed.h@example.com',
      serviceType: 'deep',
      propertyType: 'villa',
      address: '45 Oak Avenue, Abdoun',
      preferredDate: '2025-03-22',
      preferredTime: '14:00',
      notes: '',
      estimatedCost: 220,
      currency: 'JD',
      propertyLabel: 'Four Bedroom Home · 3 Bathrooms',
    },
    {
      id: 'order-demo-3',
      createdAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      status: 'rejected',
      fullName: 'Lisa Chen',
      phone: '+962 78 999 0000',
      email: 'lisa.c@example.com',
      serviceType: 'office',
      propertyType: 'office',
      address: 'Business Park, Building B',
      preferredDate: '2025-03-18',
      preferredTime: '08:00',
      notes: 'Large open plan office.',
      estimatedCost: 350,
      currency: 'JD',
      propertyLabel: 'Hourly Service · 2 Cleaners · 7.5 Hours',
    },
    {
      id: 'order-demo-4',
      createdAt: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      status: 'refunded',
      fullName: 'Omar Khalil',
      phone: '+962 79 888 7766',
      email: 'omar.k@example.com',
      serviceType: 'move-in-out',
      propertyType: 'apartment',
      address: '88 Sunset Blvd, Swefieh',
      preferredDate: '2025-03-15',
      preferredTime: '11:00',
      notes: 'Cancelled by customer.',
      estimatedCost: 150,
      currency: 'JD',
      propertyLabel: 'Three Bedroom Home · 2 Bathrooms',
    },
    {
      id: 'order-demo-5',
      createdAt: iso(new Date(now.getTime() - 30 * 60 * 1000)),
      status: 'pending',
      fullName: 'Emma Wilson',
      phone: '+962 77 111 2233',
      email: 'emma.w@example.com',
      serviceType: 'residential',
      propertyType: 'apartment',
      address: '5 Pine Lane, Jabal Amman',
      preferredDate: '2025-03-25',
      preferredTime: '09:00',
      notes: '',
      estimatedCost: 65,
      currency: 'JD',
      propertyLabel: 'One Bedroom Home · 0 Bathrooms',
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  /** In-memory store. Replace with HTTP calls to your backend (e.g. CreateStripePayment flow). */
  private orders: Order[] = createSampleOrders();
  private idCounter = 100;

  /** Add a new order (e.g. when booking form is submitted). */
  /** Add a new order (e.g. from booking form or backend CreateStripePayment). */
  addOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
    const order: Order = {
      ...data,
      id: `order-${this.idCounter++}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.orders.unshift(order);
    return order;
  }

  /** Load orders from backend (e.g. after CreateStripePayment). For now we use in-memory list. */
  setOrders(orders: Order[]): void {
    this.orders = [...orders];
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  setStatus(id: string, status: OrderStatus): void {
    const order = this.orders.find((o) => o.id === id);
    if (order) order.status = status;
  }

  accept(id: string): void {
    this.setStatus(id, 'accepted');
  }

  reject(id: string): void {
    this.setStatus(id, 'rejected');
  }

  refund(id: string): void {
    this.setStatus(id, 'refunded');
  }
}
