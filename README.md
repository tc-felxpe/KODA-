# KODA - Sistema de Gestión de Tareas tipo Notion

## Estructura del Proyecto

```
KODA/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/      # BlockEditor, SortableBlock, SlashCommandMenu
│   │   │   └── layout/      # Sidebar
│   │   ├── hooks/          # useAutoSave
│   │   ├── lib/            # supabase, api, utils
│   │   ├── pages/          # Auth, Dashboard, PageEditor
│   │   ├── stores/        # Zustand store
│   │   ├── styles/        # Tailwind CSS
│   │   └── types/         # TypeScript interfaces
│   └── public/
├── backend/           # Node.js + Express + TypeScript
│   └── src/
│       ├── controllers/   # Workspace, Page, Block controllers
│       └── routes/        # API routes
└── supabase/
    └── migrations/      # SQL schema
```

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + TipTap + dnd-kit + Zustand + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL + Auth)

## Configuración

1. **Supabase**: Copia el SQL en `supabase/migrations/001_initial_schema.sql`
2. **Frontend**: Copia `.env.example` a `.env` y configura tus credenciales
3. **Backend**: Copia `.env.example` a `.env` y configura tus credenciales

## Ejecución

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev
```

## Características

- Editor de bloques tipo Notion (TipTap)
- Drag & drop entre bloques (dnd-kit)
- Guardado automático con debounce
- Workspaces múltiples
- Páginas jerárquicas
- Sidebar tipo Notion
- Tipos de bloques: texto, encabezados, listas, checklists, código, citas, divisores
- Sistema de comandos (/)
- Auth con Supabase