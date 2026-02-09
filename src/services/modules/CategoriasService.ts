import { ApiClient, ApiResponse } from '../core/ApiClient';
import {
  Categoria,
  CategoriaCreacion,
  CategoriaActualizacion,
  ListaRespuesta,
  PaginacionParams
} from '../types';

export class CategoriasService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Listar categorías - ✅ CORREGIDO
  async listar(params?: PaginacionParams): Promise<ApiResponse<{ categorias: Categoria[], total: number }>> {
    return this.apiClient.get<{ categorias: Categoria[], total: number }>('/api/routes/categorias.php?action=list', params);
  }

  // Obtener todas las categorías activas - ✅ CORREGIDO
  async obtenerActivas(): Promise<ApiResponse<Categoria[]>> {
    return this.apiClient.get<Categoria[]>('/api/routes/categorias.php?action=active');
  }

  // Obtener categoría por ID - ✅ YA CORRECTO
  async obtenerPorId(id: number): Promise<ApiResponse<{ categoria: Categoria }>> {
    return this.apiClient.get<{ categoria: Categoria }>(`/api/routes/categorias.php?action=get&id=${id}`);
  }

  // Crear categoría - ✅ CORREGIDO
  async crear(datos: CategoriaCreacion): Promise<ApiResponse<Categoria>> {
    return this.apiClient.post<Categoria>('/api/routes/categorias.php?action=create', datos);
  }

  // Actualizar categoría - ✅ CORREGIDO
  async actualizar(id: number, datos: CategoriaActualizacion): Promise<ApiResponse<Categoria>> {
    return this.apiClient.put<Categoria>(`/api/routes/categorias.php?action=update&id=${id}`, datos);
  }

  // Eliminar categoría - ✅ CORREGIDO
  async eliminar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.delete<{ message: string }>(`/api/routes/categorias.php?action=delete&id=${id}`);
  }

  // Activar/desactivar categoría - ✅ CORREGIDO
  async cambiarEstado(id: number, activo: boolean): Promise<ApiResponse<Categoria>> {
    return this.apiClient.patch<Categoria>(`/api/routes/categorias.php?action=toggle&id=${id}`, { activo });
  }

  // Obtener árbol de categorías - ✅ YA CORRECTO
  async obtenerArbol(): Promise<ApiResponse<{ tree: Categoria[] }>> {
    return this.apiClient.get<{ tree: Categoria[] }>('/api/routes/categorias.php?action=tree');
  }

  // Obtener estadísticas de categorías - ✅ CORREGIDO
  async obtenerEstadisticas(): Promise<ApiResponse<{
    total: number;
    activas: number;
    inactivas: number;
    con_productos: number;
    sin_productos: number;
  }>> {
    return this.apiClient.get('/api/routes/categorias.php?action=stats');
  }
}