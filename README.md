# KODA - Sistema de Gestión de Tareas tipo Notion

KODA es una aplicación web de gestión de tareas y notas inspirada en Notion. Permite crear espacios de trabajo, páginas con contenido en bloques arrastrables, y organizar tu información de forma jerárquica.

![KODA](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![KODA](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![KODA](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?logo=tailwindcss)
![KODA](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)

---

## Qué contiene el proyecto

### Frontend (`/frontend`)
Aplicación React con las siguientes tecnologías:
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** para estilos
- **TipTap** como editor de texto enriquecido
- **dnd-kit** para arrastrar y soltar bloques
- **Zustand** para manejo de estado global
- **Lucide React** para iconos
- **Framer Motion** para animaciones
- **Supabase client** llamado directamente desde el frontend

### Backend (`/backend`)
API REST construida con:
- **Node.js** + **Express** + **TypeScript**
- Controladores para Workspaces, Páginas y Bloques (actualmente no se utiliza; el frontend llama a Supabase directamente)

### Base de datos (`/supabase`)
- **Supabase** (PostgreSQL + Autenticación)
- Migraciones SQL para el esquema inicial

---

## Qué se puede hacer

### Autenticación
- Registro de usuarios con email y contraseña
- Inicio de sesión
- Cierre de sesión

### Espacios de Trabajo (Workspaces)
- Crear múltiples espacios de trabajo
- Eliminar espacios de trabajo con confirmación
- Navegar entre espacios

### Páginas
- Crear páginas dentro de un workspace
- Editar título de la página en tiempo real (guardado automático)
- Marcar páginas como favoritas
- Eliminar páginas
- Asignar iconos/emojis a las páginas
- Navegación jerárquica

### Editor de Bloques
- **Agregar bloques** de diferentes tipos:
  - Párrafo de texto
  - Encabezados (H1, H2, H3)
  - Lista con viñetas
  - Lista numerada
  - Lista de tareas (checkbox)
  - Cita
  - Bloque de código
  - Divisor
- **Editar contenido** con formato enriquecido:
  - Negrita, cursiva, subrayado, tachado
  - Código inline
  - Resaltado de texto
  - Alineación (izquierda, centro, derecha)
- **Arrastrar y soltar** bloques para reordenarlos
- **Duplicar** bloques
- **Eliminar** bloques
- **Guardado automático** con debounce (500ms)
- **Menú de comandos** con `/` para insertar bloques rápidamente
- **Panel de comentarios** por página (crear, listar, eliminar)

### Sidebar
- Navegación principal: Inicio / Páginas / Favoritos / Recientes
- Lista de workspaces con búsqueda inline y edición
- Navegación jerárquica de workspaces y páginas
- Crear nuevas páginas desde el sidebar
- Menú contextual para eliminar workspaces
- Perfil de usuario en el footer

### Responsive
- Diseño adaptable a móviles, tablets y desktop
- Menú hamburguesa en móvil para acceder al sidebar
- Toolbars y headers optimizados para pantallas pequeñas
- Dashboard con tarjetas de estadísticas y actividad reciente

---

## Estructura del Proyecto

```
KODA/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/      # BlockEditor, SortableBlock, SlashCommandMenu
│   │   │   ├── layout/      # Sidebar
│   │   │   └── ui/          # MarqueeText
│   │   ├── hooks/           # useAutoSave
│   │   ├── lib/             # supabase, api, utils
│   │   ├── pages/           # Auth, Dashboard, PageEditor, WorkspaceView
│   │   ├── stores/          # Zustand store
│   │   ├── styles/          # Tailwind CSS
│   │   └── types/           # TypeScript interfaces
│   └── public/
├── backend/           # Node.js + Express + TypeScript
│   └── src/
│       ├── controllers/   # Workspace, Page, Block controllers
│       └── routes/        # API routes
└── supabase/
    └── migrations/      # SQL schema
```

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Editor | TipTap (ProseMirror) |
| Drag & Drop | dnd-kit |
| Estado | Zustand |
| Backend | Node.js + Express + TypeScript |
| Base de datos | Supabase (PostgreSQL + Auth) |
| Iconos | Lucide React |

---

## Configuración local

### 1. Supabase
1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL en orden dentro del SQL Editor de Supabase:
   - `001_initial_schema.sql`
   - `002_fix_auth_trigger.sql`
   - `003_fix_rls_policies.sql`
   - `004_fix_trigger_and_rls.sql`
   - `005_comments.sql`
3. Copia la URL y la anon key del proyecto

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# Edita .env con tus credenciales de Supabase
npm install
npm run dev
```

### 3. Backend
```bash
cd backend
cp .env.example .env
# Edita .env con tu DATABASE_URL de Supabase
npm install
npm run dev
```

---

## Scripts disponibles

```bash
# Frontend (puerto 5173/5174)
cd frontend && npm run dev

# Backend (puerto 3001)
cd backend && npm run dev
```

---

## Estado del proyecto

El proyecto está en desarrollo activo. Algunas características planificadas:
- [ ] Búsqueda global
- [ ] Plantillas de páginas
- [ ] Compartir páginas
- [x] Comentarios
- [ ] Historial de versiones
- [ ] Exportar a PDF/Markdown
- [ ] Modo offline

---

## Autor

**Andres Felipe Castillo** - [@tc-felxpe](https://github.com/tc-felxpe)
