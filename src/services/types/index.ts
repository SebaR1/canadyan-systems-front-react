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
  created_at: string;         // ✅ Cambiado de fecha_registro a created_at
  updated_at?: string;        // ✅ Agregado para consistencia
  provincia?: string;
  tipo_usuario_id: number;
  tipo_usuario_nombre?: string;
  email_verificado?: boolean; // ✅ Agregado campo que sí existe en la DB
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
  destacado: boolean;
  activo: boolean;
  created_at: string;
  updated_at?: string;
  sku?: string;
  imagen_principal_url?: string; 
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
  q?: string;              // ✅ Cambiar 'query' por 'q'
  categoria_id?: number;
  precio_min?: number;
  precio_max?: number;
  activo?: boolean;
  page?: number;           // ✅ Agregar
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
  nombreApellido: string;
  cuit: string;
  correoElectronico: string;
  celular?: string;
  localidad?: string;
  razonSocialEmpresa: string;
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

// Tipos para Atributo
export interface Atributo {
  id: number;
  nombre: string;
  tipo: 'text' | 'select' | 'number' | 'boolean';
  valores?: string[];
  created_at: string;
  updated_at: string;
}

export interface AtributoCreacion {
  nombre: string;
  tipo: 'text' | 'select' | 'number' | 'boolean';
  valores?: string[];
}

export interface AtributoActualizacion {
  nombre?: string;
  tipo?: 'text' | 'select' | 'number' | 'boolean';
  valores?: string[];
}

export interface ProductoAtributo {
  producto_id: number;
  atributo_id: number;
  valor: string;
  atributo_nombre?: string;
  atributo_tipo?: string;
}

export interface AtributoConValores {
  id: number;
  nombre: string;
  tipo: string;
  valores: string[];
}

export interface FiltrosAtributos {
  [atributoId: string]: string[];
}

// Tipos para filtros comunes
export interface FiltroFecha {
  fecha_desde?: string;
  fecha_hasta?: string;
}