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

  // Listar categorías
  async listar(params?: PaginacionParams): Promise<ApiResponse<ListaRespuesta<Categoria>>> {
    return this.apiClient.get<ListaRespuesta<Categoria>>('/categorias.php?action=list', params);
  }

  // Obtener todas las categorías activas (para selects)
  async obtenerActivas(): Promise<ApiResponse<Categoria[]>> {
    return this.apiClient.get<Categoria[]>('/categorias.php?action=active');
  }

  // Obtener categoría por ID
  async obtenerPorId(id: number): Promise<ApiResponse<Categoria>> {
    return this.apiClient.get<Categoria>(`/categorias.php?action=get&id=${id}`);
  }

  // Crear categoría
  async crear(datos: CategoriaCreacion): Promise<ApiResponse<Categoria>> {
    return this.apiClient.post<Categoria>('/categorias.php?action=create', datos);
  }

  // Actualizar categoría
  async actualizar(id: number, datos: CategoriaActualizacion): Promise<ApiResponse<Categoria>> {
    return this.apiClient.put<Categoria>(`/categorias.php?action=update&id=${id}`, datos);
  }

  // Eliminar categoría
  async eliminar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.delete<{ message: string }>(`/categorias.php?action=delete&id=${id}`);
  }

  // Activar/desactivar categoría
  async cambiarEstado(id: number, activo: boolean): Promise<ApiResponse<Categoria>> {
    return this.apiClient.patch<Categoria>(`/categorias.php?action=toggle&id=${id}`, { activo });
  }

  // Obtener árbol de categorías (estructura jerárquica)
  async obtenerArbol(): Promise<ApiResponse<{ tree: Categoria[] }>> {
    return this.apiClient.get<{ tree: Categoria[] }>('/api/routes/categorias.php?action=tree');
  }


  // Obtener estadísticas de categorías (admin)
  async obtenerEstadisticas(): Promise<ApiResponse<{
    total: number;
    activas: number;
    inactivas: number;
    con_productos: number;
    sin_productos: number;
  }>> {
    return this.apiClient.get('/categorias.php?action=stats');
  }
}
