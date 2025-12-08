import { ApiClient, ApiResponse } from '../core/ApiClient';
import {
  Producto,
  ProductoCreacion,
  ProductoActualizacion,
  ProductoBusqueda,
  ListaRespuesta,
  PaginacionParams
} from '../types';

export class ProductosService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Listar productos
  async listar(params?: PaginacionParams): Promise<ApiResponse<{ 
    productos: Producto[];
    total: number;
    pagination: any;
  }>> {
    return this.apiClient.get<{ 
      productos: Producto[];
      total: number;
      pagination: any;
    }>('/api/routes/productos.php?action=list', params);
  }

  // Obtener producto por ID
  async obtenerPorId(id: number): Promise<ApiResponse<Producto>> {
    return this.apiClient.get<Producto>(`/api/routes/productos.php?action=get&id=${id}`);
  }

  // Crear producto
  async crear(datos: ProductoCreacion): Promise<ApiResponse<Producto>> {
    return this.apiClient.post<Producto>('/api/routes/productos.php?action=create', datos);
  }

  // Actualizar producto
  async actualizar(id: number, datos: ProductoActualizacion): Promise<ApiResponse<Producto>> {
    return this.apiClient.put<Producto>(`/api/routes/productos.php?action=update&id=${id}`, datos);
  }

  // Eliminar producto
  async eliminar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.delete<{ message: string }>(`/api/routes/productos.php?action=delete&id=${id}`);
  }

  // Buscar productos
  async buscar(filtros: ProductoBusqueda): Promise<ApiResponse<{
    productos: Producto[];
    search_term: string;
    total_results: number;
    pagination: {
      current_page: number;
      per_page: number;
    }
  }>> {
    return this.apiClient.get<{
      productos: Producto[];
      search_term: string;
      total_results: number;
      pagination: {
        current_page: number;
        per_page: number;
      }
    }>('/api/routes/productos.php?action=search', filtros);
  }

  // Obtener productos por categoría
  async obtenerPorCategoria(categoriaId: number, params?: PaginacionParams): Promise<ApiResponse<{
    productos: Producto[];
    categoria: any;
    total_results: number;
    pagination: any;
  }>> {
    return this.apiClient.get<{
      productos: Producto[];
      categoria: any;
      total_results: number;
      pagination: any;
    }>(`/api/routes/productos.php?action=by-category&categoria_id=${categoriaId}`, params);
  }


  // Obtener productos destacados
  async obtenerDestacados(limit?: number): Promise<ApiResponse<{ 
    productos: Producto[];
    total: number;
  }>> {
    return this.apiClient.get<{ 
      productos: Producto[];
      total: number;
    }>('/api/routes/productos.php?action=featured', { limit });
  }

  // Obtener productos más vendidos
  async obtenerMasVendidos(limit?: number): Promise<ApiResponse<Producto[]>> {
    return this.apiClient.get<Producto[]>('/api/routes/productos.php?action=best-sellers', { limit });
  }

  // Obtener productos relacionados
  async obtenerRelacionados(id: number, limit?: number): Promise<ApiResponse<Producto[]>> {
    return this.apiClient.get<Producto[]>(`/api/routes/productos.php?action=related&id=${id}`, { limit });
  }

  // Activar/desactivar producto
  async cambiarEstado(id: number, activo: boolean): Promise<ApiResponse<Producto>> {
    return this.apiClient.patch<Producto>(`/api/routes/productos.php?action=toggle&id=${id}`, { activo });
  }

  // Actualizar stock
  async actualizarStock(id: number, stock: number): Promise<ApiResponse<Producto>> {
    return this.apiClient.patch<Producto>(`/api/routes/productos.php?action=update-stock&id=${id}`, { stock });
  }

  // Subir imagen de producto
  async subirImagen(id: number, archivo: File): Promise<ApiResponse<{ imagen_url: string }>> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('producto_id', id.toString());
    
    return this.apiClient.upload<{ imagen_url: string }>('/api/routes/productos.php?action=upload-image', formData);
  }

  // Obtener estadísticas de productos (admin)
  async obtenerEstadisticas(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    sin_stock: number;
    valor_total_inventario: number;
  }>> {
    return this.apiClient.get('/api/routes/productos.php?action=stats');
  }

  // Marcar/desmarcar como destacado (admin)
  async toggleDestacado(id: number): Promise<ApiResponse<{ 
    producto_id: number;
    destacado_anterior: boolean;
    destacado_nuevo: boolean;
  }>> {
    return this.apiClient.patch<{
      producto_id: number;
      destacado_anterior: boolean;
      destacado_nuevo: boolean;
    }>(`/api/routes/productos.php?action=toggle-featured&id=${id}`, {});
  }
}
