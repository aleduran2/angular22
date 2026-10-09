export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface User {
  email: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export type PaymentMethod = 'card' | 'transfer' | 'cash';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  email: string;
  street: string;
  city: string;
  zip: string;
}

export interface OrderRequest {
  items: { productId: number; quantity: number }[];
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  coupon: string;
}

export interface OrderLine {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userEmail: string;
  items: OrderLine[];
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  message: string;
  errors?: ApiFieldError[];
}
