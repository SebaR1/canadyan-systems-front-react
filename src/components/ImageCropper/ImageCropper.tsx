import React, { useState, useRef, useCallback } from 'react';
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Recortar Imagen
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Ajusta el área de recorte a la proporción deseada
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Selector de proporción */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selecciona la proporción deseada:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {aspectRatioPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleAspectChange(preset.value)}
                className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                  aspect === preset.value
                    ? 'bg-orange-600 text-white border-orange-600 shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                }`}
                disabled={processing}
              >
                {/* Icono visual de proporción */}
                <div className="flex justify-center mb-2">
                  <div 
                    className={`border-2 ${
                      aspect === preset.value ? 'border-white' : 'border-gray-400'
                    }`}
                    style={{
                      width: preset.value === 1 ? '40px' : preset.value > 1 ? '50px' : '35px',
                      height: preset.value === 1 ? '40px' : preset.value > 1 ? '37.5px' : '46.7px'
                    }}
                  />
                </div>
                <div className="font-semibold">{preset.label}</div>
                <div className={`text-xs mt-1 ${
                  aspect === preset.value ? 'text-orange-100' : 'text-gray-500'
                }`}>
                  {preset.description}
                </div>
                
                {/* Checkmark cuando está seleccionado */}
                {aspect === preset.value && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Área de recorte */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="flex items-center justify-center min-h-full">
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
                className="max-w-full max-h-[500px] object-contain"
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

        {/* Información */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-2">💡 Cómo usar la herramienta de recorte:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">1.</span>
                  <span>Selecciona la <strong>proporción</strong> deseada arriba</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <span>Arrastra las <strong>esquinas</strong> para ajustar el tamaño</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <span>Arrastra el <strong>centro</strong> para mover la selección</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">4.</span>
                  <span>Click en <strong>"Recortar"</strong> cuando esté lista</span>
                </div>
              </div>
            </div>
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