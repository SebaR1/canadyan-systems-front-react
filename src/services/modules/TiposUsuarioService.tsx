import { ApiClient, ApiResponse } from '../core/ApiClient';

export interface TipoUsuario {
  id: number;
  nombre: string;
  descripcion?: string;
}

export class TiposUsuarioService {
  private apiClient: ApiClient;
  private readonly basePath = '/api/routes/tipos-usuario.php';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Obtener todos los tipos de usuario
   */
  async listar(): Promise<ApiResponse<{ tipos: TipoUsuario[] }>> {
    return this.apiClient.get(`${this.basePath}?action=list`);
  }
}
