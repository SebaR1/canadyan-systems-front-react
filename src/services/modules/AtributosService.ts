import { ApiClient, ApiResponse } from '../core/ApiClient';
import {
  Atributo,
  AtributoCreacion,
  AtributoActualizacion,
  ProductoAtributo,
  AtributoConValores,
  FiltrosAtributos,
  Producto,
  ListaRespuesta,
  PaginacionParams
} from '../types';

export class AtributosService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Listar atributos
  async listar(): Promise<ApiResponse<{ atributos: Atributo[], total: number }>> {
    return this.apiClient.get<{ atributos: Atributo[], total: number }>('/api/routes/atributos.php?action=list');
  }

  // Obtener atributo por ID
  async obtenerPorId(id: number): Promise<ApiResponse<{ atributo: Atributo & { valores_unicos: string[] } }>> {
    return this.apiClient.get<{ atributo: Atributo & { valores_unicos: string[] } }>(`/api/routes/atributos.php?action=get&id=${id}`);
  }

  // Crear atributo
  async crear(datos: AtributoCreacion): Promise<ApiResponse<{ atributo: Atributo }>> {
    return this.apiClient.post<{ atributo: Atributo }>('/api/routes/atributos.php?action=create', datos);
  }

  // Actualizar atributo
  async actualizar(id: number, datos: AtributoActualizacion): Promise<ApiResponse<{ atributo: Atributo }>> {
    return this.apiClient.put<{ atributo: Atributo }>(`/api/routes/atributos.php?action=update&id=${id}`, datos);
  }

  // Eliminar atributo
  async eliminar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.delete<{ message: string }>(`/api/routes/atributos.php?action=delete&id=${id}`);
  }

  // Obtener filtros para el catálogo (atributos con sus valores únicos)
  async obtenerFiltros(categoriaId?: number): Promise<ApiResponse<{ filtros: AtributoConValores[] }>> {
    let url = '/api/routes/atributos.php?action=filters';
    if (categoriaId) {
      url += `&categoria_id=${categoriaId}`;
    }
    return this.apiClient.get<{ filtros: AtributoConValores[] }>(url);
  }

  // Asignar atributos a un producto
  async asignarAProducto(
    productoId: number, 
    atributos: Array<{ atributo_id: number; valor: string }>
  ): Promise<ApiResponse<{ producto_id: number; atributos_count: number }>> {
    return this.apiClient.post<{ producto_id: number; atributos_count: number }>(
      '/api/routes/atributos.php?action=assign-product',
      {
        producto_id: productoId,
        atributos: atributos
      }
    );
  }

  // Obtener atributos de un producto
  async obtenerPorProducto(productoId: number): Promise<ApiResponse<{ producto_id: number; atributos: ProductoAtributo[] }>> {
    return this.apiClient.get<{ producto_id: number; atributos: ProductoAtributo[] }>(
      `/api/routes/atributos.php?action=by-product&producto_id=${productoId}`
    );
  }

  // Filtrar productos por atributos
  async filtrarProductos(
    filtros: FiltrosAtributos,
    params?: PaginacionParams,
    categoriaId?: number // ← NUEVO PARÁMETRO
    ): Promise<ApiResponse<{
      productos: Producto[];
      filtros_aplicados: FiltrosAtributos;
      pagination: {
        current_page: number;
        per_page: number;
        total_results: number;
      }
    }>> {
      const body = {
        filtros: filtros,
        page: params?.offset ? Math.floor(params.offset / (params.limit || 10)) + 1 : 1,
        limit: params?.limit || 10,
        categoria_id: categoriaId // ← AGREGAR CATEGORÍA AL BODY
      };

      return this.apiClient.post<{
        productos: Producto[];
        filtros_aplicados: FiltrosAtributos;
        pagination: {
          current_page: number;
          per_page: number;
          total_results: number;
        }
      }>('/api/routes/atributos.php?action=filter-products', body);
  }

  // Método de conveniencia para filtrar productos con parámetros simples
  async filtrarProductosSimple(
    filtros: Record<string, string[]>,
    page: number = 1,
    limit: number = 10,
    categoriaId?: number // ← NUEVO PARÁMETRO
    ): Promise<ApiResponse<{
      productos: Producto[];
      filtros_aplicados: FiltrosAtributos;
      pagination: {
        current_page: number;
        per_page: number;
        total_results: number;
      }
    }>> {
      // Convertir filtros a formato esperado por la API
      const filtrosFormateados: FiltrosAtributos = {};
      
      Object.entries(filtros).forEach(([key, valores]) => {
        if (valores && valores.length > 0) {
          filtrosFormateados[key] = valores;
        }
      });

      return this.filtrarProductos(filtrosFormateados, {
        offset: (page - 1) * limit,
        limit: limit
      }, categoriaId); // ← PASAR CATEGORÍA
  }

  // Obtener valores únicos de un atributo específico
  async obtenerValoresUnicos(atributoId: number): Promise<ApiResponse<{ atributo: Atributo & { valores_unicos: string[] } }>> {
    return this.obtenerPorId(atributoId);
  }

  // Método helper para crear múltiples atributos
  async crearMultiples(atributos: AtributoCreacion[]): Promise<{
    exitosos: Atributo[];
    errores: Array<{ atributo: AtributoCreacion; error: string }>;
  }> {
    const exitosos: Atributo[] = [];
    const errores: Array<{ atributo: AtributoCreacion; error: string }> = [];

    for (const atributo of atributos) {
      try {
        const response = await this.crear(atributo);
        if (response.success && response.data) {
          exitosos.push(response.data.atributo);
        } else {
          errores.push({
            atributo: atributo,
            error: response.error || 'Error desconocido'
          });
        }
      } catch (error) {
        errores.push({
          atributo: atributo,
          error: error instanceof Error ? error.message : 'Error de conexión'
        });
      }
    }

    return { exitosos, errores };
  }

  // Método helper para validar filtros antes de enviar
  private validarFiltros(filtros: FiltrosAtributos): boolean {
    if (!filtros || typeof filtros !== 'object') {
      return false;
    }

    for (const [atributoId, valores] of Object.entries(filtros)) {
      if (!Array.isArray(valores) || valores.length === 0) {
        continue; // Saltar filtros vacíos
      }

      if (!/^\d+$/.test(atributoId)) {
        console.warn(`ID de atributo inválido: ${atributoId}`);
        return false;
      }

      if (!valores.every(valor => typeof valor === 'string' && valor.trim() !== '')) {
        console.warn(`Valores inválidos para atributo ${atributoId}:`, valores);
        return false;
      }
    }

    return true;
  }

  // Método para limpiar filtros vacíos
  static limpiarFiltros(filtros: FiltrosAtributos): FiltrosAtributos {
    const filtrosLimpios: FiltrosAtributos = {};

    Object.entries(filtros).forEach(([atributoId, valores]) => {
      if (Array.isArray(valores) && valores.length > 0) {
        const valoresLimpios = valores.filter(valor => 
          typeof valor === 'string' && valor.trim() !== ''
        );
        
        if (valoresLimpios.length > 0) {
          filtrosLimpios[atributoId] = valoresLimpios;
        }
      }
    });

    return filtrosLimpios;
  }
}