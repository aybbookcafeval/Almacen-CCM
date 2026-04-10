import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Movimiento, MovimientoFormData } from '../types';

// Mock data for preview
let mockMovimientos: Movimiento[] = [
  { id: '101', bundle_id: 'b1', materia_prima_id: '1', tipo: 'entrada', cantidad: 100, unidad_medida: 'kg', fecha: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: '102', bundle_id: 'b2', materia_prima_id: '2', tipo: 'salida', cantidad: 50, unidad_medida: 'kg', fecha: new Date().toISOString(), created_at: new Date().toISOString() },
];

export const getMovimientos = async (): Promise<Movimiento[]> => {
  if (!isSupabaseConfigured()) {
    return [...mockMovimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
  const { data, error } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return data;
};

export const createMovimiento = async (data: MovimientoFormData): Promise<Movimiento> => {
  if (!isSupabaseConfigured()) {
    const newMov: Movimiento = {
      ...data,
      id: Math.random().toString(36).substring(7),
      bundle_id: data.bundle_id || Math.random().toString(36).substring(7),
      fecha: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockMovimientos.push(newMov);
    return newMov;
  }
  
  // In a real app, this should be a database function (RPC) or trigger to ensure atomicity
  // For this implementation, we do it in two steps
  
  // 1. Get current stock
  const { data: mp, error: mpError } = await supabase.from('materia_prima').select('stock').eq('id', data.materia_prima_id).single();
  if (mpError) throw mpError;
  
  const newStock = data.tipo === 'entrada' ? mp.stock + data.cantidad : mp.stock - data.cantidad;
  
  if (newStock < 0) {
    throw new Error('El stock no puede ser negativo');
  }

  // 2. Insert movement
  const { data: newMov, error: movError } = await supabase.from('movimientos').insert([{ ...data, fecha: new Date().toISOString() }]).select().single();
  if (movError) throw movError;

  // 3. Update stock
  const { error: updateError } = await supabase.from('materia_prima').update({ stock: newStock }).eq('id', data.materia_prima_id);
  if (updateError) throw updateError;

  return newMov;
};

export const uploadEvidence = async (file: File): Promise<string> => {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file); // Mock URL
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage.from('movimientos').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('movimientos').getPublicUrl(filePath);
  return data.publicUrl;
};
