/**
 * Servicio para gestionar archivos descargables de productos
 * Canadian Sistemas Frontend
 */

import { ApiClient, ApiResponse } from '../core/ApiClient';
import { ProductoArchivo } from '../types';

export interface ArchivoUploadResponse {
  archivos: ProductoArchivo[];
  total_subidos: number;
  errores: string[];
}

export interface ArchivoValidation {
  valid: boolean;
  error?: string;
  file?: File;
}

export class ProductoArchivoService {
  private apiClient: ApiClient;

  // Configuración de validación
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxArchivos = 15;
  private readonly tiposPermitidos = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/rtf',
    'application/rtf',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  private readonly extensionesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'rtf', 'jpg', 'jpeg', 'png', 'gif'];

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Subir uno o varios archivos
   */
  async subirArchivos(
    productoId: number,
    archivos: File[],
    nombresPersonalizados?: string[]
  ): Promise<ApiResponse<ArchivoUploadResponse>> {
    const formData = new FormData();
    formData.append('producto_id', productoId.toString());

    // Agregar nombres personalizados si existen
    if (nombresPersonalizados && nombresPersonalizados.length > 0) {
      formData.append('nombres_personalizados', JSON.stringify(nombresPersonalizados));
    }

    // Agregar múltiples archivos
    archivos.forEach((archivo) => {
      formData.append('archivos[]', archivo);
    });

    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/producto_archivos.php?action=upload`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // NO enviar Content-Type, el browser lo configura automáticamente con boundary
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Error al subir archivos',
        };
      }

      return {
        success: data.success || true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error de red al subir archivos',
      };
    }
  }

  /**
   * Listar todos los archivos de un producto
   */
  async listarArchivos(productoId: number): Promise<ApiResponse<ProductoArchivo[]>> {
    const response = await this.apiClient.get<{ archivos: ProductoArchivo[]; total: number }>(
      `/api/routes/producto_archivos.php?action=list&producto_id=${productoId}`
    );

    // Transformar respuesta para retornar solo el array de archivos
    if (response.success && response.data?.archivos) {
      return {
        success: true,
        data: response.data.archivos,
        message: response.message
      };
    }

    return {
      success: false,
      error: response.error || 'Error al obtener archivos'
    };
  }

  /**
   * Actualizar nombre personalizado de un archivo
   */
  async actualizarNombre(
    id: number,
    nombrePersonalizado: string | null
  ): Promise<ApiResponse<void>> {
    return this.apiClient.patch(
      '/api/routes/producto_archivos.php?action=update',
      {
        id,
        nombre_personalizado: nombrePersonalizado
      }
    );
  }

  /**
   * Eliminar un archivo
   */
  async eliminarArchivo(archivoId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(
      `/api/routes/producto_archivos.php?action=delete&id=${archivoId}`
    );
  }

  /**
   * Reordenar archivos
   */
  async reordenarArchivos(ordenes: Array<{ id: number; orden: number }>): Promise<ApiResponse<void>> {
    return this.apiClient.patch(
      '/api/routes/producto_archivos.php?action=reorder',
      { ordenes }
    );
  }

  /**
   * Descargar archivo directamente (sin abrir nueva pestaña)
   */
  async descargarArchivo(archivoId: number, filename: string): Promise<void> {
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/producto_archivos.php?action=download&id=${archivoId}`;
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        alert('Error al descargar archivo');
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar archivo');
    }
  }

  /**
   * Validar archivo en el cliente
   */
  validateFile(file: File): ArchivoValidation {
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `El archivo "${file.name}" excede el tamaño máximo de ${this.maxFileSize / 1048576}MB`,
        file
      };
    }

    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.extensionesPermitidas.includes(extension)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido: .${extension}. Tipos permitidos: ${this.extensionesPermitidas.join(', ')}`,
        file
      };
    }

    // Validar tipo MIME
    if (!this.tiposPermitidos.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo MIME no permitido para "${file.name}": ${file.type}`,
        file
      };
    }

    return {
      valid: true,
      file
    };
  }

  /**
   * Validar múltiples archivos
   */
  validateFiles(files: File[]): {
    valid: ArchivoValidation[];
    invalid: ArchivoValidation[];
    allValid: boolean;
  } {
    const validations = files.map(file => this.validateFile(file));
    const valid = validations.filter(v => v.valid);
    const invalid = validations.filter(v => !v.valid);

    return {
      valid,
      invalid,
      allValid: invalid.length === 0
    };
  }

  /**
   * Formatear tamaño de archivo en bytes a formato legible
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtener icono según tipo de archivo
   */
  getFileIcon(tipoArchivo: string): string {
    const extension = tipoArchivo.toLowerCase();

    const iconMap: { [key: string]: string } = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️'
    };

    return iconMap[extension] || '📎';
  }

  /**
   * Obtener color según tipo de archivo
   */
  getFileColor(tipoArchivo: string): string {
    const extension = tipoArchivo.toLowerCase();

    const colorMap: { [key: string]: string } = {
      'pdf': 'text-red-500',
      'doc': 'text-blue-500',
      'docx': 'text-blue-500',
      'xls': 'text-green-500',
      'xlsx': 'text-green-500',
      'jpg': 'text-purple-500',
      'jpeg': 'text-purple-500',
      'png': 'text-purple-500',
      'gif': 'text-purple-500'
    };

    return colorMap[extension] || 'text-gray-500';
  }

  /**
   * Obtener URL completa del archivo
   */
  getFileUrl(url: string): string {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    // Si la URL ya es completa, retornarla tal cual
    if (url.startsWith('http')) {
      return url;
    }
    // Construir URL completa
    return `${baseUrl}/${url}`;
  }

  /**
   * Obtener configuración de validación
   */
  getConfig() {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: this.maxFileSize / 1048576,
      maxArchivos: this.maxArchivos,
      tiposPermitidos: this.tiposPermitidos,
      extensionesPermitidas: this.extensionesPermitidas
    };
  }
}
