export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
};

export type MateriaPrima = {
  id: string;
  nombre: string;
  unidad_medida: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  created_at: string;
  updated_at: string;
};

export type Movimiento = {
  id: string;
  bundle_id: string;
  materia_prima_id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  unidad_medida: string;
  fecha: string;
  imagen_url?: string;
  comentario?: string;
  created_at: string;
};

export type MateriaPrimaFormData = Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'stock'>;
export type MovimientoFormData = Omit<Movimiento, 'id' | 'created_at' | 'fecha'>;

export type MovimientoItem = {
  materia_prima_id: string;
  cantidad: number;
  unidad_medida: string;
};

export type MovimientoBundleFormData = {
  tipo: 'entrada' | 'salida';
  items: MovimientoItem[];
  imagen_url?: string;
  comentario?: string;
};
