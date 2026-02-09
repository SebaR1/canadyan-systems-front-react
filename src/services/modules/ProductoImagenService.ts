/**
 * Servicio para gestionar imágenes de productos
 * Canadian Sistemas Frontend
 */

import { ApiClient, ApiResponse } from '../core/ApiClient';

export interface ProductoImagen {
  id: number;
  producto_id: number;
  url: string;
  tipo: 'principal' | 'galeria' | 'esquema';
  orden: number;
  alt_text?: string;
}

export interface ImagenUploadResponse {
  imagenes: ProductoImagen[];
  total_subidas: number;
  errores: string[];
}

export interface ImagenValidation {
  valid: boolean;
  error?: string;
  dimensions?: {
    width: number;
    height: number;
    aspect_ratio: number;
    aspect_ratio_type: string;
  };
}

export class ProductoImagenService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Subir una o varias imágenes
   */
  async subirImagenes(
    productoId: number, 
    archivos: File[], 
    tipo: 'principal' | 'galeria' | 'esquema' = 'galeria'
  ): Promise<ApiResponse<ImagenUploadResponse>> {
    const formData = new FormData();
    formData.append('producto_id', productoId.toString());
    formData.append('tipo', tipo);
    
    // Agregar múltiples archivos
    archivos.forEach((archivo) => {
      formData.append('imagenes[]', archivo);
    });

    // Usar fetch directo en vez del upload del ApiClient para evitar problemas con headers
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/producto_imagenes.php?action=upload`;
      
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
          error: data.message || data.error || 'Error al subir imágenes',
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
        error: error.message || 'Error de red al subir imágenes',
      };
    }
  }

  /**
   * Listar todas las imágenes de un producto
   */
  async listarImagenes(productoId: number): Promise<ApiResponse<{ imagenes: ProductoImagen[]; total: number }>> {
    return this.apiClient.get(
      `/api/routes/producto_imagenes.php?action=list&producto_id=${productoId}`
    );
  }

  /**
   * Eliminar una imagen
   */
  async eliminarImagen(imagenId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(
      `/api/routes/producto_imagenes.php?action=delete&id=${imagenId}`
    );
  }

  /**
   * Cambiar imagen principal
   */
  async cambiarPrincipal(imagenId: number): Promise<ApiResponse<void>> {
    return this.apiClient.patch(
      `/api/routes/producto_imagenes.php?action=set-principal&id=${imagenId}`
    );
  }

  /**
   * Reordenar imágenes
   */
  async reordenarImagenes(ordenes: Array<{ id: number; orden: number }>): Promise<ApiResponse<void>> {
    return this.apiClient.patch(
      '/api/routes/producto_imagenes.php?action=reorder',
      { ordenes }
    );
  }

  /**
   * Validar imagen en el cliente (dimensiones y formato)
   */
  validateImage(file: File): Promise<ImagenValidation> {
    return new Promise((resolve) => {
      // Validar tamaño
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        resolve({
          valid: false,
          error: 'El archivo excede el tamaño máximo de 5MB'
        });
        return;
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        resolve({
          valid: false,
          error: 'Tipo de archivo no permitido. Solo JPG, PNG y GIF'
        });
        return;
      }

      // Validar dimensiones y proporción
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;

        // Validar dimensiones mínimas
        if (width < 500 || height < 500) {
          resolve({
            valid: false,
            error: `La imagen debe tener al menos 500x500px. Tu imagen: ${width}x${height}px`
          });
          return;
        }

        // Validar dimensiones máximas
        if (width > 3000 || height > 3000) {
          resolve({
            valid: false,
            error: `La imagen no debe exceder 3000x3000px. Tu imagen: ${width}x${height}px`
          });
          return;
        }

        // Validar proporción con tolerancia del 2%
        const aspectRatios = {
          cuadrado: { min: 0.98, max: 1.02, label: '1:1 (cuadrado)' },
          horizontal: { min: 1.31, max: 1.36, label: '4:3 (horizontal)' },
          vertical: { min: 0.73, max: 0.77, label: '3:4 (vertical)' }
        };

        let validRatio = false;
        let ratioType = '';

        for (const [key, range] of Object.entries(aspectRatios)) {
          if (ratio >= range.min && ratio <= range.max) {
            validRatio = true;
            ratioType = key;
            break;
          }
        }

        if (!validRatio) {
          resolve({
            valid: false,
            error: `La imagen debe tener proporción 1:1, 4:3 o 3:4.\nTu imagen: ${width}x${height} (${ratio.toFixed(2)}:1)\n\nEjemplos válidos:\n• Cuadrado: 800x800, 1000x1000\n• Horizontal: 800x600, 1200x900\n• Vertical: 600x800, 900x1200`
          });
          return;
        }

        // Todo OK
        resolve({
          valid: true,
          dimensions: {
            width,
            height,
            aspect_ratio: ratio,
            aspect_ratio_type: ratioType
          }
        });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: 'No se pudo cargar la imagen'
        });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Validar múltiples imágenes
   */
  async validateImages(files: File[]): Promise<{
    valid: ImagenValidation[];
    invalid: ImagenValidation[];
    allValid: boolean;
  }> {
    const validations = await Promise.all(
      files.map(file => this.validateImage(file))
    );

    const valid = validations.filter(v => v.valid);
    const invalid = validations.filter(v => !v.valid);

    return {
      valid,
      invalid,
      allValid: invalid.length === 0
    };
  }

  /**
   * Obtener URL completa de la imagen
   */
  getImageUrl(url: string): string {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    // Si la URL ya es completa, retornarla tal cual
    if (url.startsWith('http')) {
      return url;
    }
    // Construir URL completa
    return `${baseUrl}/${url}`;
  }
}