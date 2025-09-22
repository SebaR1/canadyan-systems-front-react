// Tipos para Usuario
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  razon_social_empresa?: string;
  cuit: string;
  correo_electronico: string;
  celular?: string;
  ciudad?: string;
  direccion?: string;
  fecha_registro: string;
  activo: boolean;
  provincia?: string;
  tipo_usuario_id: number;
  tipo_usuario_nombre?: string;
}

export interface UsuarioRegistro {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}

export interface UsuarioLogin {
  email: string;
  password: string;
}

export interface UsuarioActualizacion {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

// Tipos para Producto
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  categoria_nombre?: string;
  imagen_url?: string;
  stock: number;
  activo: boolean;
  fecha_creacion: string;
}

export interface ProductoCreacion {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  imagen_url?: string;
  stock: number;
}

export interface ProductoActualizacion {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria_id?: number;
  imagen_url?: string;
  stock?: number;
  activo?: boolean;
}

export interface ProductoBusqueda {
  query?: string;
  categoria_id?: number;
  precio_min?: number;
  precio_max?: number;
  activo?: boolean;
  limit?: number;
  offset?: number;
}

// Tipos para Categoria
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  slug: string;           // ← Agregar
  parent_id: number | null;  // ← Agregar  
  children?: Categoria[]; // ← Agregar (opcional)
  activo: boolean;
  fecha_creacion: string;
}

export interface CategoriaCreacion {
  nombre: string;
  descripcion?: string;
}

export interface CategoriaActualizacion {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// Tipos para Contacto
export interface Contacto {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  fecha_envio: string;
  leido: boolean;
}

export interface ContactoEnvio {
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
}

// Tipos de respuesta de la API
export interface ListaRespuesta<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthRespuesta {
  token: string;
  usuario: Usuario;
  expires_in: number;
}

// Tipos para paginación
export interface PaginacionParams {
  limit?: number;
  offset?: number;
}

// Tipos para filtros comunes
export interface FiltroFecha {
  fecha_desde?: string;
  fecha_hasta?: string;
}
