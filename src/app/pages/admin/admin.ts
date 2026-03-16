import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService, Order, OrderStatus } from '../../core/orders.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private ordersService = inject(OrdersService);

  orders: Order[] = [];
  filterStatus: OrderStatus | 'all' = 'all';

  readonly serviceTypeLabels: Record<string, string> = {
    residential: 'Residential Cleaning',
    deep: 'Deep Cleaning',
    'move-in-out': 'Move In / Move Out',
    office: 'Office Cleaning',
  };

  readonly propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartment',
    villa: 'Villa',
    office: 'Office',
    shop: 'Shop',
  };

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orders = this.ordersService.getOrders();
  }

  get filteredOrders(): Order[] {
    if (this.filterStatus === 'all') return this.orders;
    return this.orders.filter((o) => o.status === this.filterStatus);
  }

  accept(order: Order): void {
    this.ordersService.accept(order.id);
    this.loadOrders();
  }

  reject(order: Order): void {
    this.ordersService.reject(order.id);
    this.loadOrders();
  }

  refund(order: Order): void {
    this.ordersService.refund(order.id);
    this.loadOrders();
  }

  setFilter(status: OrderStatus | 'all'): void {
    this.filterStatus = status;
  }

  serviceLabel(value: string): string {
    return this.serviceTypeLabels[value] ?? value;
  }

  propertyLabel(value: string): string {
    return this.propertyTypeLabels[value] ?? value;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
}
