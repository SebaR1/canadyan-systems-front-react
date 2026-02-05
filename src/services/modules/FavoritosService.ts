import { ApiClient, ApiResponse } from '../core/ApiClient';
import { Producto } from '../types';

const ENDPOINT = '/api/routes/favoritos.php';

export class FavoritosService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Agregar producto a favoritos del usuario actual
   */
  async agregar(productoId: number): Promise<ApiResponse<{ producto_id: number }>> {
    return this.apiClient.post(`${ENDPOINT}?action=add`, { producto_id: productoId });
  }

  /**
   * Eliminar producto de favoritos del usuario actual
   */
  async eliminar(productoId: number): Promise<ApiResponse<any>> {
    return this.apiClient.delete(`${ENDPOINT}?action=remove&producto_id=${productoId}`);
  }

  /**
   * Listar todos los favoritos con datos completos del producto (para página /favoritos)
   */
  async listar(): Promise<ApiResponse<{ productos: Producto[]; total: number }>> {
    return this.apiClient.get(`${ENDPOINT}?action=list`);
  }

  /**
   * Listar solo los IDs de productos favoritos (liviano, para Catalogo)
   */
  async listarIds(): Promise<ApiResponse<{ ids: number[] }>> {
    return this.apiClient.get(`${ENDPOINT}?action=list-ids`);
  }

  /**
   * Verificar si un producto específico es favorito del usuario actual
   */
  async verificar(productoId: number): Promise<ApiResponse<{ es_favorito: boolean; producto_id: number }>> {
    return this.apiClient.get(`${ENDPOINT}?action=check&producto_id=${productoId}`);
  }
}
