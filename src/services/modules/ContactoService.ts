import { ApiClient, ApiResponse } from '../core/ApiClient';
import {
  Contacto,
  ContactoEnvio,
  ListaRespuesta,
  PaginacionParams
} from '../types';

export class ContactoService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Enviar mensaje de contacto
  async enviar(datos: ContactoEnvio): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.post<{ message: string }>('/api/routes/contacto.php?action=send', datos);
  }

  // Listar mensajes de contacto (admin)
  async listar(params?: PaginacionParams & { leido?: boolean }): Promise<ApiResponse<ListaRespuesta<Contacto>>> {
    return this.apiClient.get<ListaRespuesta<Contacto>>('/api/routes/contacto.php?action=list', params);
  }

  // Obtener mensaje por ID (admin)
  async obtenerPorId(id: number): Promise<ApiResponse<Contacto>> {
    return this.apiClient.get<Contacto>(`/api/routes/contacto.php?action=get&id=${id}`);
  }

  // Marcar mensaje como leído (admin)
  async marcarComoLeido(id: number): Promise<ApiResponse<Contacto>> {
    return this.apiClient.patch<Contacto>(`/api/routes/contacto.php?action=mark-read&id=${id}`);
  }

  // Obtener mensajes no leídos (admin)
  async obtenerNoLeidos(): Promise<ApiResponse<Contacto[]>> {
    return this.apiClient.get<Contacto[]>('/api/routes/contacto.php?action=unread');
  }

  // Obtener estadísticas de contacto (admin)
  async obtenerEstadisticas(): Promise<ApiResponse<{
    total: number;
    leidos: number;
    no_leidos: number;
    mensajes_hoy: number;
    mensajes_semana: number;
  }>> {
    return this.apiClient.get('/api/routes/contacto.php?action=stats');
  }
}
