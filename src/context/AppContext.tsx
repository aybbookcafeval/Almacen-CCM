import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MateriaPrima, Movimiento, MateriaPrimaFormData, MovimientoFormData, MovimientoBundleFormData } from '../types';
import * as materiaPrimaService from '../services/materiaPrima';
import * as movimientosService from '../services/movimientos';

interface AppContextType {
  materiasPrimas: MateriaPrima[];
  movimientos: Movimiento[];
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  addMateriaPrima: (data: MateriaPrimaFormData) => Promise<void>;
  editMateriaPrima: (id: string, data: Partial<MateriaPrimaFormData>) => Promise<void>;
  removeMateriaPrima: (id: string) => Promise<void>;
  addMovimiento: (data: MovimientoBundleFormData, file?: File) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mpData, movData] = await Promise.all([
        materiaPrimaService.getMateriasPrimas(),
        movimientosService.getMovimientos()
      ]);
      setMateriasPrimas(mpData);
      setMovimientos(movData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addMateriaPrima = async (data: MateriaPrimaFormData) => {
    try {
      const newMp = await materiaPrimaService.createMateriaPrima(data);
      setMateriasPrimas(prev => [...prev, newMp]);
    } catch (err: any) {
      throw new Error(err.message || 'Error al crear materia prima');
    }
  };

  const editMateriaPrima = async (id: string, data: Partial<MateriaPrimaFormData>) => {
    try {
      const updatedMp = await materiaPrimaService.updateMateriaPrima(id, data);
      setMateriasPrimas(prev => prev.map(mp => mp.id === id ? updatedMp : mp));
    } catch (err: any) {
      throw new Error(err.message || 'Error al actualizar materia prima');
    }
  };

  const removeMateriaPrima = async (id: string) => {
    try {
      await materiaPrimaService.deleteMateriaPrima(id);
      setMateriasPrimas(prev => prev.filter(mp => mp.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Error al eliminar materia prima');
    }
  };

  const addMovimiento = async (data: MovimientoBundleFormData, file?: File) => {
    try {
      let imagen_url = data.imagen_url;
      if (file) {
        imagen_url = await movimientosService.uploadEvidence(file);
      }
      
      const bundle_id = Math.random().toString(36).substring(7);
      
      const newMovs = await Promise.all(data.items.map(item => movimientosService.createMovimiento({ 
        bundle_id,
        materia_prima_id: item.materia_prima_id,
        tipo: data.tipo,
        cantidad: item.cantidad,
        unidad_medida: item.unidad_medida,
        imagen_url
      })));
      
      // Update local stock
      setMateriasPrimas(prev => prev.map(mp => {
        const movementsForMp = data.items.filter(item => item.materia_prima_id === mp.id);
        if (movementsForMp.length > 0) {
          let newStock = mp.stock;
          movementsForMp.forEach(item => {
            newStock = data.tipo === 'entrada' ? newStock + item.cantidad : newStock - item.cantidad;
          });
          return { ...mp, stock: newStock };
        }
        return mp;
      }));
      
      setMovimientos(prev => [...newMovs, ...prev]);
    } catch (err: any) {
      throw new Error(err.message || 'Error al registrar movimiento');
    }
  };

  return (
    <AppContext.Provider value={{
      materiasPrimas,
      movimientos,
      loading,
      error,
      loadData,
      addMateriaPrima,
      editMateriaPrima,
      removeMateriaPrima,
      addMovimiento
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
