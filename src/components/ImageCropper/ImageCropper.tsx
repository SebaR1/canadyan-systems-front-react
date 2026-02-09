import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  isOpen: boolean;
  imageUrl: string;
  fileName: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

type AspectRatioPreset = {
  label: string;
  value: number;
  description: string;
};

const aspectRatioPresets: AspectRatioPreset[] = [
  { label: 'Cuadrado (1:1)', value: 1, description: '800x800, 1000x1000' },
  { label: 'Horizontal (4:3)', value: 4/3, description: '800x600, 1200x900' },
  { label: 'Vertical (3:4)', value: 3/4, description: '600x800, 900x1200' }
];

const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  imageUrl,
  fileName,
  onCropComplete,
  onCancel
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number>(1); // Default cuadrado
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Estado para mostrar dimensiones en tiempo real
  const [cropDimensions, setCropDimensions] = useState<{
    width: number;
    height: number;
    isValid: boolean;
  } | null>(null);

  const MIN_SIZE = 500; // Tamaño mínimo requerido

  // Calcular dimensiones finales cuando el crop cambia
  useEffect(() => {
    if (completedCrop && imgRef.current) {
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const finalWidth = Math.round(completedCrop.width * scaleX);
      const finalHeight = Math.round(completedCrop.height * scaleY);
      const isValid = finalWidth >= MIN_SIZE && finalHeight >= MIN_SIZE;

      setCropDimensions({ width: finalWidth, height: finalHeight, isValid });
    }
  }, [completedCrop]);

  // Cambiar proporción
  const handleAspectChange = (newAspect: number) => {
    if (!imgRef.current) return;
    
    setAspect(newAspect);
    
    const img = imgRef.current;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const imgAspect = imgWidth / imgHeight;
    
    // Calcular crop óptimo según la proporción seleccionada
    let cropWidth: number;
    let cropHeight: number;
    
    if (newAspect >= imgAspect) {
      // La proporción deseada es más ancha que la imagen
      cropWidth = imgWidth;
      cropHeight = imgWidth / newAspect;
    } else {
      // La proporción deseada es más alta que la imagen
      cropHeight = imgHeight;
      cropWidth = imgHeight * newAspect;
    }
    
    // Convertir a porcentaje y centrar
    const cropWidthPercent = (cropWidth / imgWidth) * 100;
    const cropHeightPercent = (cropHeight / imgHeight) * 100;
    
    setCrop({
      unit: '%',
      width: Math.min(cropWidthPercent, 95),
      height: Math.min(cropHeightPercent, 95),
      x: (100 - Math.min(cropWidthPercent, 95)) / 2,
      y: (100 - Math.min(cropHeightPercent, 95)) / 2
    });
  };

  // Procesar imagen recortada
  const handleCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      alert('Por favor selecciona un área para recortar');
      return;
    }

    try {
      setProcessing(true);

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo crear el canvas');
      }

      // Calcular el scale factor
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Configurar canvas con las dimensiones del crop
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      // Dibujar la imagen recortada
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convertir canvas a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert('Error al procesar la imagen');
            setProcessing(false);
            return;
          }

          // Crear archivo desde blob
          const extension = fileName.split('.').pop() || 'jpg';
          const croppedFile = new File(
            [blob],
            `cropped_${fileName}`,
            { type: `image/${extension === 'jpg' ? 'jpeg' : extension}` }
          );

          onCropComplete(croppedFile);
          setProcessing(false);
        },
        `image/${fileName.split('.').pop() === 'png' ? 'png' : 'jpeg'}`,
        0.95
      );
    } catch (error) {
      console.error('Error al recortar:', error);
      alert('Error al recortar la imagen');
      setProcessing(false);
    }
  }, [completedCrop, fileName, onCropComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        
        {/* Header con selector de proporción */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-medium text-gray-900 whitespace-nowrap">
              Recortar
            </h3>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {aspectRatioPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleAspectChange(preset.value)}
                  className={`px-2 py-1 rounded text-sm font-medium transition-all border ${
                    aspect === preset.value
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                  }`}
                  disabled={processing}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              onClick={onCancel}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Área de recorte - altura dinámica con scroll */}
        <div className="relative max-h-[calc(100vh-180px)] overflow-auto bg-gray-100">
          {/* Badge de dimensiones - sticky para que siempre sea visible */}
          {cropDimensions && (
            <div className="sticky top-2 float-right mr-4 z-20">
              <div className={`px-2 py-1 rounded shadow text-xs font-medium ${
                cropDimensions.isValid
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                <div className="flex items-center gap-1">
                  {cropDimensions.isValid ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{cropDimensions.width} × {cropDimensions.height}px</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 flex items-center justify-center clear-both">

            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Imagen a recortar"
                className="max-w-full"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const imgWidth = img.width;
                  const imgHeight = img.height;
                  const imgAspect = imgWidth / imgHeight;

                  // Calcular crop óptimo inicial (usar 80% del área disponible)
                  let cropWidth: number;
                  let cropHeight: number;

                  if (aspect >= imgAspect) {
                    // La proporción deseada es más ancha que la imagen
                    cropWidth = imgWidth * 0.8;
                    cropHeight = cropWidth / aspect;
                  } else {
                    // La proporción deseada es más alta que la imagen
                    cropHeight = imgHeight * 0.8;
                    cropWidth = cropHeight * aspect;
                  }

                  // Convertir a porcentaje y centrar
                  const cropWidthPercent = (cropWidth / imgWidth) * 100;
                  const cropHeightPercent = (cropHeight / imgHeight) * 100;

                  setCrop({
                    unit: '%',
                    width: Math.min(cropWidthPercent, 95),
                    height: Math.min(cropHeightPercent, 95),
                    x: (100 - Math.min(cropWidthPercent, 95)) / 2,
                    y: (100 - Math.min(cropHeightPercent, 95)) / 2
                  });
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Botones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrop}
            disabled={processing || !completedCrop}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Procesando...
              </div>
            ) : (
              'Recortar y Usar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;