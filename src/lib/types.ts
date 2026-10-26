export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string; // Laravel lo devuelve como decimal en texto, ej. "19.99"
  stock: number;
  image_url: string | null;
  active: boolean;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

export type User = { id: number; name: string; email: string };

export type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  product?: Product | null;
};

export type Payment = {
  id: number;
  stripe_payment_intent_id: string;
  amount: string;
  currency: string;
  status: string;
};

export type OrderStatus = "pending" | "paid" | "cancelled";

export type Order = {
  id: number;
  user_id: number;
  total: string;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
  payment?: Payment | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
};

/** Estado que devuelven las Server Actions de formularios */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  /** Lo que escribió el usuario, para no borrar el formulario si hay error */
  values?: Record<string, string>;
} | null;
