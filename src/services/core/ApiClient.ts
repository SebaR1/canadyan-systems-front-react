export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        credentials: 'include', // LÍNEA AGREGADA
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Detectar sesión expirada ANTES de parsear el body completo
      if (response.status === 401 || response.status === 403) {
        let errorData;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          }
        } catch (e) {
          // Si falla el parse, continuar con errorData undefined
        }

        const message = errorData?.message || '';
        // Solo tratar como sesión expirada si el usuario realmente estaba logueado
        const hadSession = !!localStorage.getItem('user');
        if (hadSession && (message.toLowerCase().includes('acceso denegado') ||
            message.toLowerCase().includes('no autorizado') ||
            message.toLowerCase().includes('solo administradores') ||
            message.toLowerCase().includes('requieren permisos'))) {

          // Limpiar autenticación
          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');

          // Marcar que la sesión expiró para que el Header lo detecte
          localStorage.setItem('session_expired', 'true');

          // Emitir evento para que otros componentes lo sepan
          window.dispatchEvent(new CustomEvent('session-expired'));

          // Emitir evento storage manualmente (para mismo tab)
          window.dispatchEvent(new Event('storage'));

          // NO redirigir - dejar que el Header maneje la redirección y notificación

          // Retornar error para evitar procesar más
          return {
            success: false,
            error: 'Sesión expirada. Redirigiendo al login...',
          };
        }

        // No es sesión expirada, retornar el error ya parseado sin leer el body otra vez
        return {
          success: false,
          error: errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
        };
      }

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: (data && (data.message || data.error)) || `HTTP ${response.status}: ${response.statusText}`,
          data: data,
        };
      }

      // Normalize envelope: if backend returns { success, message, error, data }, unwrap to ApiResponse
      if (data && typeof data === 'object' && (('data' in data) || ('success' in data) || ('message' in data) || ('error' in data))) {
        const envelope: any = data as any;
        const normalized: ApiResponse<any> = {
          success: typeof envelope.success === 'boolean' ? envelope.success : true,
          data: ('data' in envelope) ? envelope.data : envelope,
          message: envelope.message,
          error: envelope.error,
        };
        return normalized;
      }

      // Fallback: return raw parsed body as data
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }

      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        // ✅ CORRECCIÓN: Detectar si ya tiene "?" en la URL
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Método para subir archivos
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // No establecer Content-Type para FormData, el browser lo hace automáticamente
      },
    });
  }

  // Método para configurar headers adicionales (ej: Authorization)
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  // Método para remover headers
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  // Método para obtener la configuración actual
  getConfig(): { baseUrl: string; timeout: number; headers: Record<string, string> } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      headers: { ...this.defaultHeaders },
    };
  }
}
