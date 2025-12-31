import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { ProductoImagen } from '../../services/modules/ProductoImagenService';
import ImageCropper from '../ImageCropper/ImageCropper';

interface ImageUploadManagerProps {
  productoId: number | null;
  imagenes: ProductoImagen[];
  onImagenesChange: (imagenes: ProductoImagen[]) => void;
  onUpload: (archivos: File[]) => Promise<void>;
  onDelete: (imagenId: number) => Promise<void>;
  onSetPrincipal: (imagenId: number) => Promise<void>;
  maxImagenes?: number;
  disabled?: boolean;
  onPreviewsChange?: (hasPreviews: boolean, validPreviews: File[]) => void; // Nuevo: notificar cambios en previews
}

export interface ImageUploadManagerRef {
  uploadPendingImages: () => Promise<boolean>; // Retorna true si se subieron imágenes
}

interface ImagePreview {
  file: File;
  preview: string;
  valid: boolean;
  error?: string;
}

const ImageUploadManager = forwardRef<ImageUploadManagerRef, ImageUploadManagerProps>(({
  productoId,
  imagenes,
  onImagenesChange,
  onUpload,
  onDelete,
  onSetPrincipal,
  maxImagenes = 10,
  disabled = false,
  onPreviewsChange
}, ref) => {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el cropper
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; file: File } | null>(null);

  // Notificar cambios en previews al componente padre
  React.useEffect(() => {
    if (onPreviewsChange) {
      const validPreviews = previews.filter(p => p.valid).map(p => p.file);
      onPreviewsChange(previews.length > 0, validPreviews);
    }
  }, [previews, onPreviewsChange]);

  // Exponer función para subir imágenes pendientes desde el componente padre
  useImperativeHandle(ref, () => ({
    uploadPendingImages: async () => {
      const validFiles = previews.filter(p => p.valid).map(p => p.file);

      if (validFiles.length === 0) {
        return false; // No hay imágenes para subir
      }

      try {
        setUploading(true);
        await onUpload(validFiles);

        // Limpiar previews exitosos
        previews.forEach(p => URL.revokeObjectURL(p.preview));
        setPreviews([]);
        return true; // Imágenes subidas exitosamente
      } catch (error) {
        console.error('Error al subir imágenes:', error);
        throw error; // Propagar el error para que el padre lo maneje
      } finally {
        setUploading(false);
      }
    }
  }));

  // Validar imagen
  const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Validar tamaño
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        resolve({ valid: false, error: 'Máximo 5MB' });
        return;
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        resolve({ valid: false, error: 'Solo JPG, PNG, GIF' });
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

        // Dimensiones mínimas
        if (width < 500 || height < 500) {
          resolve({ valid: false, error: `Mínimo 500x500px (${width}x${height})` });
          return;
        }

        // Dimensiones máximas
        if (width > 3000 || height > 3000) {
          resolve({ valid: false, error: `Máximo 3000x3000px (${width}x${height})` });
          return;
        }

        // Validar proporción (±2%)
        const aspectRatios = {
          cuadrado: { min: 0.98, max: 1.02 },
          horizontal: { min: 1.31, max: 1.36 },
          vertical: { min: 0.73, max: 0.77 }
        };

        let validRatio = false;
        for (const range of Object.values(aspectRatios)) {
          if (ratio >= range.min && ratio <= range.max) {
            validRatio = true;
            break;
          }
        }

        if (!validRatio) {
          resolve({ 
            valid: false, 
            error: `Proporción inválida (${ratio.toFixed(2)}:1). Debe ser 1:1, 4:3 o 3:4` 
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        resolve({ valid: false, error: 'Error al cargar imagen' });
      };

      reader.readAsDataURL(file);
    });
  };

  // Manejar selección de archivos
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Verificar límite de imágenes
    const totalImagenes = imagenes.length + previews.length + files.length;
    if (totalImagenes > maxImagenes) {
      alert(`Máximo ${maxImagenes} imágenes por producto`);
      return;
    }

    const newPreviews: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await validateImage(file);
      
      // Si la imagen NO es válida por proporción o tamaño, abrir cropper
      if (!validation.valid && (validation.error?.includes('Proporción inválida') || validation.error?.includes('Mínimo'))) {
        const url = URL.createObjectURL(file);
        setImageToCrop({ url, file });
        setShowCropper(true);
        return; // Solo procesar una imagen a la vez con cropper
      }
      
      const preview: ImagePreview = {
        file,
        preview: URL.createObjectURL(file),
        valid: validation.valid,
        error: validation.error
      };

      newPreviews.push(preview);
    }

    setPreviews([...previews, ...newPreviews]);
  };

  // Remover preview
  const removePreview = (index: number) => {
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  // Subir imágenes
  const handleUpload = async () => {
    const validFiles = previews.filter(p => p.valid).map(p => p.file);
    
    if (validFiles.length === 0) {
      alert('No hay imágenes válidas para subir');
      return;
    }

    try {
      setUploading(true);
      await onUpload(validFiles);
      
      // Limpiar previews exitosos
      previews.forEach(p => URL.revokeObjectURL(p.preview));
      setPreviews([]);
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      alert('Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Manejar imagen recortada
  const handleCropComplete = async (croppedFile: File) => {
    // Validar la imagen recortada
    const validation = await validateImage(croppedFile);
    
    const preview: ImagePreview = {
      file: croppedFile,
      preview: URL.createObjectURL(croppedFile),
      valid: validation.valid,
      error: validation.error
    };

    setPreviews([...previews, preview]);
    
    // Limpiar cropper
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop.url);
    }
    setImageToCrop(null);
    setShowCropper(false);
  };

  // Cancelar crop
  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop.url);
    }
    setImageToCrop(null);
    setShowCropper(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Zona de upload */}
      {!disabled && imagenes.length + previews.length < maxImagenes && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-300 hover:border-orange-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-orange-600 hover:text-orange-500 font-medium"
            >
              Seleccionar archivos
            </button>
            {' '}o arrastrar aquí
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, GIF • Máximo 5MB • Proporción 1:1, 4:3 o 3:4
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {imagenes.length + previews.length}/{maxImagenes} imágenes
          </p>
        </div>
      )}

      {/* Previews de imágenes a subir */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Imágenes seleccionadas ({previews.length})
            </h4>
            <p className="text-xs text-gray-500">
              {uploading ? 'Subiendo...' : 'Se subirán al guardar el producto'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className={`relative border-2 rounded-lg overflow-hidden ${
                  preview.valid ? 'border-green-300' : 'border-red-300'
                }`}
              >
                <img
                  src={preview.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                
                {/* Badge de estado */}
                <div className={`absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-medium ${
                  preview.valid 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {preview.valid ? '✓ Válida' : '✗ Inválida'}
                </div>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Error */}
                {!preview.valid && preview.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-90 text-white text-xs p-1">
                    {preview.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Imágenes ya subidas */}
      {imagenes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Imágenes del producto ({imagenes.length})
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imagenes.map((imagen) => (
              <div 
                key={imagen.id} 
                className="relative border-2 rounded-lg overflow-hidden border-gray-200 hover:border-orange-400 transition-colors group"
              >
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/${imagen.url}`}
                  alt={imagen.alt_text || 'Imagen producto'}
                  className="w-full h-32 object-cover"
                />

                {/* Badge Principal */}
                {imagen.tipo === 'principal' && (
                  <div className="absolute top-1 left-1 bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                    ⭐ Principal
                  </div>
                )}

                {/* Acciones (visible al hover) */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    
                    {/* Botón hacer principal */}
                    {imagen.tipo !== 'principal' && (
                      <button
                        type="button"
                        onClick={() => onSetPrincipal(imagen.id)}
                        className="bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600"
                        title="Marcar como principal"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Eliminar esta imagen?')) {
                          onDelete(imagen.id);
                        }
                      }}
                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                      title="Eliminar imagen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay imágenes */}
      {imagenes.length === 0 && previews.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          No hay imágenes. Sube al menos una imagen para el producto.
        </div>
      )}

      {/* Modal de recorte */}
      {showCropper && imageToCrop && (
        <ImageCropper
          isOpen={showCropper}
          imageUrl={imageToCrop.url}
          fileName={imageToCrop.file.name}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
});

ImageUploadManager.displayName = 'ImageUploadManager';

export default ImageUploadManager;