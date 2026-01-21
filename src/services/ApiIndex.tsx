import { ApiClient } from './core/ApiClient';
import { UsuariosService } from './modules/UsuariosService';
import { ProductosService } from './modules/ProductosService';
import { CategoriasService } from './modules/CategoriasService';
import { ContactoService } from './modules/ContactoService';
import { AtributosService } from './modules/AtributosService';
import { ProductoImagenService } from './modules/ProductoImagenService';
import { TiposUsuarioService } from './modules/TiposUsuarioService';

export class ApiManager {
  private static instance: ApiManager;
  private apiClient: ApiClient;

  // Servicios
  public usuarios: UsuariosService;
  public productos: ProductosService;
  public categorias: CategoriasService;
  public contacto: ContactoService;
  public atributos: AtributosService;
  public productoImagenes: ProductoImagenService;
  public tiposUsuario: TiposUsuarioService;

  private constructor() {
    // Configuración de la API - usando la URL que funcionaba antes
    // Basado en el código original del AccesoCliente que usaba localhost:8000
    const apiConfig = {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
      }
    };

    // Inicializar el cliente API
    this.apiClient = new ApiClient(apiConfig);

    // Inicializar todos los servicios
    this.usuarios = new UsuariosService(this.apiClient);
    this.productos = new ProductosService(this.apiClient);
    this.categorias = new CategoriasService(this.apiClient);
    this.contacto = new ContactoService(this.apiClient);
    this.atributos = new AtributosService(this.apiClient);
    this.productoImagenes = new ProductoImagenService(this.apiClient);
    this.tiposUsuario = new TiposUsuarioService(this.apiClient);

    // Configurar interceptores si es necesario
    this.setupInterceptors();
  }

  // Singleton pattern
  public static getInstance(): ApiManager {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager();
    }
    return ApiManager.instance;
  }

  // Configurar interceptores y manejo de autenticación
  private setupInterceptors(): void {
    // Obtener token del localStorage si existe
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  // Métodos de utilidad para manejo de autenticación
  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.apiClient.setHeader('Authorization', `Bearer ${token}`);
  }

  public removeAuthToken(): void {
    localStorage.removeItem('auth_token');
    this.apiClient.removeHeader('Authorization');
  }

  public getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Método para obtener información de la API
  public async getApiInfo(): Promise<any> {
    return this.apiClient.get('/');
  }

  // Método para verificar el estado de la API
  public async checkApiHealth(): Promise<any> {
    return this.apiClient.get('/?info=health');
  }

  // Método para obtener la configuración actual del cliente
  public getClientConfig() {
    return this.apiClient.getConfig();
  }

  // Método para cambiar la URL base (útil para diferentes entornos)
  public updateBaseUrl(newBaseUrl: string): void {
    // Crear nueva instancia con la nueva URL
    const currentConfig = this.apiClient.getConfig();
    const newConfig = {
      ...currentConfig,
      baseUrl: newBaseUrl
    };
    
    this.apiClient = new ApiClient(newConfig);
    
    // Reinicializar servicios con el nuevo cliente
    this.usuarios = new UsuariosService(this.apiClient);
    this.productos = new ProductosService(this.apiClient);
    this.categorias = new CategoriasService(this.apiClient);
    this.contacto = new ContactoService(this.apiClient);
    this.atributos = new AtributosService(this.apiClient);
    this.tiposUsuario = new TiposUsuarioService(this.apiClient);
    
    // Reconfigurar interceptores
    this.setupInterceptors();
  }
}

// Exportar la instancia singleton
const apiManager = ApiManager.getInstance();
export default apiManager;

// También exportar los tipos para uso en componentes
export * from './types';
export type { ApiResponse } from './core/ApiClient';