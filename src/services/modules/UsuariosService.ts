import { ApiClient, ApiResponse } from '../core/ApiClient';
import {
  Usuario,
  UsuarioRegistro,
  UsuarioLogin,
  UsuarioActualizacion,
  AuthRespuesta,
  ListaRespuesta,
  PaginacionParams
} from '../types';

export class UsuariosService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Registro de usuario
  async registrar(datos: UsuarioRegistro): Promise<ApiResponse<AuthRespuesta>> {
    return this.apiClient.post<AuthRespuesta>('/api/routes/usuarios.php?action=register', datos);
  }

  // Login de usuario
  async login(credenciales: UsuarioLogin): Promise<ApiResponse<AuthRespuesta>> {
    return this.apiClient.post<AuthRespuesta>('/api/routes/usuarios.php?action=login', credenciales);
  }

  // Logout
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.post<{ message: string }>('/api/routes/usuarios.php?action=logout');
  }

  // Obtener perfil del usuario actual
  async obtenerPerfil(): Promise<ApiResponse<Usuario>> {
    return this.apiClient.get<Usuario>('/api/routes/usuarios.php?action=profile');
  }

  // Actualizar perfil del usuario actual
  async actualizarPerfil(datos: UsuarioActualizacion): Promise<ApiResponse<Usuario>> {
    return this.apiClient.put<Usuario>('/api/routes/usuarios.php?action=profile', datos);
  }

  // Obtener usuario por ID (admin)
  async obtenerPorId(id: number): Promise<ApiResponse<Usuario>> {
    return this.apiClient.get<Usuario>(`/api/routes/usuarios.php?action=get&id=${id}`);
  }

  // Listar usuarios (admin)
  async listar(params?: PaginacionParams): Promise<ApiResponse<ListaRespuesta<Usuario>>> {
    return this.apiClient.get<ListaRespuesta<Usuario>>('/api/routes/usuarios.php?action=list', params);
  }

  // Crear usuario (admin)
  async crear(datos: UsuarioRegistro): Promise<ApiResponse<Usuario>> {
    return this.apiClient.post<Usuario>('/api/routes/usuarios.php?action=create', datos);
  }

  // Actualizar usuario (admin)
  async actualizar(id: number, datos: UsuarioActualizacion): Promise<ApiResponse<Usuario>> {
    return this.apiClient.put<Usuario>(`/api/routes/usuarios.php?action=update&id=${id}`, datos);
  }

  // Eliminar usuario (admin)
  async eliminar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.delete<{ message: string }>(`/api/routes/usuarios.php?action=delete&id=${id}`);
  }

  // Activar/desactivar usuario (admin)
  async cambiarEstado(id: number, activo: boolean): Promise<ApiResponse<Usuario>> {
    return this.apiClient.patch<Usuario>(`/api/routes/usuarios.php?action=toggle&id=${id}`, { activo });
  }

  // Cambiar contraseña
  async cambiarPassword(passwordActual: string, passwordNuevo: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.put<{ message: string }>('/api/routes/usuarios.php?action=change-password', {
      current_password: passwordActual,
      new_password: passwordNuevo
    });
  }

  // Recuperar contraseña
  async recuperarPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.post<{ message: string }>('/api/routes/usuarios.php?action=forgot-password', { email });
  }

  // Resetear contraseña con token
  async resetearPassword(token: string, passwordNuevo: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiClient.post<{ message: string }>('/api/routes/usuarios.php?action=reset-password', {
      token,
      new_password: passwordNuevo
    });
  }
}
