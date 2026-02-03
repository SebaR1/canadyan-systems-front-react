import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ProductoArchivo } from '../../services/types';
import apiManager from '../../services/ApiIndex';

interface FileUploadManagerProps {
  productoId: number;
  onPendingFilesChange?: (hasPending: boolean) => void;
  onError?: (message: string) => void;
}

export interface FileUploadManagerRef {
  uploadPendingFiles: () => Promise<boolean>;
}

interface PendingFile {
  file: File;
  key: string;
  nombrePersonalizado: string;
  error?: string;
}

const FileUploadManager = forwardRef<FileUploadManagerRef, FileUploadManagerProps>(({ productoId, onPendingFilesChange, onError }, ref) => {
  const [archivosSubidos, setArchivosSubidos] = useState<ProductoArchivo[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');

  // Drag & drop para reordenar archivos subidos
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = apiManager.productoArchivos.getConfig();

  // Notificar al padre cuando cambian los archivos pendientes
  useEffect(() => {
    onPendingFilesChange?.(pendingFiles.length > 0);
  }, [pendingFiles, onPendingFilesChange]);

  // Exponer función para subir archivos pendientes desde el componente padre
  useImperativeHandle(ref, () => ({
    uploadPendingFiles: async () => {
      const validFiles = pendingFiles.filter(p => !p.error);
      if (validFiles.length === 0) return false;

      setUploading(true);
      try {
        const files = validFiles.map(p => p.file);
        const nombres = validFiles.map(p => p.nombrePersonalizado || '');
        const response = await apiManager.productoArchivos.subirArchivos(productoId, files, nombres);

        if (response.success && response.data) {
          const data = response.data;
          setArchivosSubidos(prev => [...prev, ...data.archivos]);
          const validKeys = new Set(validFiles.map(p => p.key));
          setPendingFiles(prev => prev.filter(p => !validKeys.has(p.key)));

          if (data.errores && data.errores.length > 0) {
            throw new Error('Algunos archivos no se pudieron subir: ' + data.errores.join(', '));
          }
          return true;
        } else {
          throw new Error(response.error || 'Error al subir archivos');
        }
      } finally {
        setUploading(false);
      }
    }
  }));

  // Cargar archivos existentes al montar
  useEffect(() => {
    const cargarArchivos = async () => {
      setLoading(true);
      try {
        const response = await apiManager.productoArchivos.listarArchivos(productoId);
        if (response.success && response.data) {
          setArchivosSubidos(response.data);
        }
      } catch (error) {
        console.error('Error al cargar archivos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productoId) {
      cargarArchivos();
    }
  }, [productoId]);

  // ─── HANDLERS DE DRAG & DROP (ZONA DE SUBIDA) ─────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // ─── SELECCIÓN DE ARCHIVOS ─────────────────────────────────────────────────

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const totalActual = archivosSubidos.length + pendingFiles.length;

    if (totalActual + fileArray.length > config.maxArchivos) {
      alert(`Máximo ${config.maxArchivos} archivos por producto. Actualmente tienes ${archivosSubidos.length} subidos y ${pendingFiles.length} pendientes.`);
      return;
    }

    const nuevos: PendingFile[] = [];

    fileArray.forEach((file) => {
      const validation = apiManager.productoArchivos.validateFile(file);
      nuevos.push({
        file,
        key: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nombrePersonalizado: '',
        error: validation.valid ? undefined : validation.error
      });
    });

    setPendingFiles(prev => [...prev, ...nuevos]);
  }, [archivosSubidos.length, pendingFiles.length, config.maxArchivos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  // ─── NOMBRE PERSONALIZADO (PENDING) ───────────────────────────────────────

  const handleNombreChange = (key: string, valor: string) => {
    setPendingFiles(prev =>
      prev.map(p => p.key === key ? { ...p, nombrePersonalizado: valor } : p)
    );
  };

  const handleRemovePending = (key: string) => {
    setPendingFiles(prev => prev.filter(p => p.key !== key));
  };

  // ─── SUBIDA DE ARCHIVOS ────────────────────────────────────────────────────

  const handleUpload = async () => {
    const validFiles = pendingFiles.filter(p => !p.error);
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const files = validFiles.map(p => p.file);
      const nombres = validFiles.map(p => p.nombrePersonalizado || '');

      const response = await apiManager.productoArchivos.subirArchivos(productoId, files, nombres);

      if (response.success && response.data) {
        const data = response.data;
        setArchivosSubidos(prev => [...prev, ...data.archivos]);

        // Remover los archivos que se subieron exitosamente
        const validKeys = new Set(validFiles.map(p => p.key));
        setPendingFiles(prev => prev.filter(p => !validKeys.has(p.key)));

        if (data.errores && data.errores.length > 0) {
          onError?.('Algunos archivos no se pudieron subir: ' + data.errores.join(', '));
        }
      } else {
        onError?.(response.error || 'Error al subir archivos');
      }
    } catch (error) {
      console.error('Error al subir archivos:', error);
      onError?.('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  // ─── EDITAR NOMBRE DE ARCHIVO SUBIDO ──────────────────────────────────────

  const handleStartEditNombre = (archivo: ProductoArchivo) => {
    setEditingId(archivo.id);
    setEditingNombre(archivo.nombre_personalizado || archivo.nombre_original);
  };

  const handleSaveNombre = async () => {
    if (editingId === null) return;

    try {
      const response = await apiManager.productoArchivos.actualizarNombre(editingId, editingNombre);
      if (response.success) {
        setArchivosSubidos(prev =>
          prev.map(a => a.id === editingId ? { ...a, nombre_personalizado: editingNombre } : a)
        );
      } else {
        alert(response.error || 'Error al actualizar nombre');
      }
    } catch (error) {
      console.error('Error al actualizar nombre:', error);
    } finally {
      setEditingId(null);
      setEditingNombre('');
    }
  };

  const handleCancelEditNombre = () => {
    setEditingId(null);
    setEditingNombre('');
  };

  // ─── ELIMINAR ARCHIVO ──────────────────────────────────────────────────────

  const handleDeleteArchivo = async (archivoId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      const response = await apiManager.productoArchivos.eliminarArchivo(archivoId);
      if (response.success) {
        setArchivosSubidos(prev => prev.filter(a => a.id !== archivoId));
      } else {
        alert(response.error || 'Error al eliminar archivo');
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }
  };

  // ─── DRAG & DROP PARA REORDENAR (ARCHIVOS SUBIDOS) ────────────────────────

  const handleDragStartReorder = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverReorder = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== draggingIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeaveReorder = () => {
    setDragOverIndex(null);
  };

  const handleDropReorder = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      return;
    }

    // Reordenar en estado local
    const nuevosArchivos = [...archivosSubidos];
    const [archivoMovido] = nuevosArchivos.splice(draggingIndex, 1);
    nuevosArchivos.splice(dropIndex, 0, archivoMovido);

    setArchivosSubidos(nuevosArchivos);
    setDraggingIndex(null);

    // Enviar nuevo orden al backend
    const ordenes = nuevosArchivos.map((archivo, index) => ({
      id: archivo.id,
      orden: index
    }));

    try {
      await apiManager.productoArchivos.reordenarArchivos(ordenes);
    } catch (error) {
      console.error('Error al reordenar archivos:', error);
    }
  };

  const handleDragEndReorder = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // ─── COMPONENTES DE RENDERIZADO ────────────────────────────────────────────

  // Ícono SVG según tipo de archivo
  const renderFileIcon = (tipoArchivo: string, className = 'w-8 h-8') => {
    const ext = tipoArchivo.toLowerCase();

    if (ext === 'pdf') {
      return (
        <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h12m-6-8h6m-6-4H9a2 2 0 00-2 2v14a2 2 0 002 2h6.586a1 1 0 00.707-.293l3.414-3.414A1 1 0 0019.586 14H14a2 2 0 00-2-2V6a2 2 0 00-2-2z" />
        </svg>
      );
    }

    if (ext === 'doc' || ext === 'docx') {
      return (
        <svg className={`${className} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h12m-6-8h6m-6-4H9a2 2 0 00-2 2v14a2 2 0 002 2h6.586a1 1 0 00.707-.293l3.414-3.414A1 1 0 0019.586 14H14a2 2 0 00-2-2V6a2 2 0 00-2-2z" />
        </svg>
      );
    }

    if (ext === 'xls' || ext === 'xlsx') {
      return (
        <svg className={`${className} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return (
        <svg className={`${className} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    // Default - archivo genérico
    return (
      <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  // ─── RENDER PRINCIPAL ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Cargando archivos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zona de drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          onChange={handleInputChange}
        />

        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 4v16m8-8H4" />
        </svg>

        <p className="text-orange-500 font-semibold">Seleccionar archivos</p>
        <p className="text-gray-500 text-sm mt-1">o arrastrar y soltar aquí</p>
        <p className="text-gray-400 text-xs mt-2">
          PDF, Word, Excel, JPG, PNG, GIF • Máximo {config.maxFileSizeMB}MB • Hasta {config.maxArchivos} archivos
        </p>
        <p className="text-gray-400 text-xs">
          {archivosSubidos.length}/{config.maxArchivos} archivos usados
        </p>
      </div>

      {/* Archivos pendientes de subir */}
      {pendingFiles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700">Archivos seleccionados ({pendingFiles.length})</h4>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || pendingFiles.every(p => p.error)}
              className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Subiendo...' : `Guardar Archivos (${pendingFiles.filter(p => !p.error).length})`}
            </button>
          </div>

          <div className="space-y-2">
            {pendingFiles.map((pending) => (
              <div
                key={pending.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  pending.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Ícono */}
                <div className="flex-shrink-0">
                  {renderFileIcon(pending.file.name.split('.').pop() || '', 'w-8 h-8')}
                </div>

                {/* Info del archivo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${pending.error ? 'text-red-700' : 'text-gray-800'}`}>
                    {pending.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {apiManager.productoArchivos.formatBytes(pending.file.size)}
                  </p>
                  {pending.error && (
                    <p className="text-xs text-red-600 mt-0.5">{pending.error}</p>
                  )}
                </div>

                {/* Input nombre personalizado */}
                {!pending.error && (
                  <div className="flex-shrink-0 w-48">
                    <input
                      type="text"
                      value={pending.nombrePersonalizado}
                      onChange={(e) => handleNombreChange(pending.key, e.target.value)}
                      placeholder="Nombre personalizado..."
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemovePending(pending.key)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archivos ya subidos */}
      {archivosSubidos.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">
            Archivos del producto ({archivosSubidos.length})
            <span className="text-xs text-gray-400 font-normal ml-2">Arrastra para reordenar</span>
          </h4>

          <div className="space-y-2">
            {archivosSubidos.map((archivo, index) => (
              <div
                key={archivo.id}
                draggable
                onDragStart={(e) => handleDragStartReorder(e, index)}
                onDragOver={(e) => handleDragOverReorder(e, index)}
                onDragLeave={handleDragLeaveReorder}
                onDrop={(e) => handleDropReorder(e, index)}
                onDragEnd={handleDragEndReorder}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                  draggingIndex === index
                    ? 'opacity-50 border-orange-300 bg-orange-50'
                    : dragOverIndex === index
                      ? 'border-orange-400 bg-orange-50 scale-[1.01]'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                {/* Icono de drag */}
                <div className="flex-shrink-0 text-gray-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="7" r="1.5" />
                    <circle cx="15" cy="7" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="17" r="1.5" />
                    <circle cx="15" cy="17" r="1.5" />
                  </svg>
                </div>

                {/* Ícono del archivo */}
                <div className="flex-shrink-0">
                  {renderFileIcon(archivo.tipo_archivo)}
                </div>

                {/* Info del archivo */}
                <div className="flex-1 min-w-0">
                  {editingId === archivo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingNombre}
                        onChange={(e) => setEditingNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNombre();
                          if (e.key === 'Escape') handleCancelEditNombre();
                        }}
                        className="flex-1 text-sm px-2 py-1 border border-orange-400 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        autoFocus
                      />
                      <button type="button" onClick={handleSaveNombre} className="text-green-600 hover:text-green-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button type="button" onClick={handleCancelEditNombre} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {archivo.nombre_personalizado || archivo.nombre_original}
                      </p>
                      {archivo.nombre_personalizado && (
                        <p className="text-xs text-gray-400 truncate">{archivo.nombre_original}</p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-500">
                    {archivo.tipo_archivo.toUpperCase()} • {apiManager.productoArchivos.formatBytes(archivo.tamanio_bytes)}
                  </p>
                </div>

                {/* Acciones */}
                {editingId !== archivo.id && (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {/* Editar nombre */}
                    <button
                      type="button"
                      onClick={() => handleStartEditNombre(archivo)}
                      title="Editar nombre"
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Descargar */}
                    <button
                      type="button"
                      onClick={() => apiManager.productoArchivos.descargarArchivo(archivo.id, archivo.nombre_personalizado ? `${archivo.nombre_personalizado}.${archivo.tipo_archivo}` : archivo.nombre_original)}
                      title="Descargar"
                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleDeleteArchivo(archivo.id)}
                      title="Eliminar"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {archivosSubidos.length === 0 && pendingFiles.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          No hay archivos asociados a este producto aún.
        </div>
      )}
    </div>
  );
});

export default FileUploadManager;
