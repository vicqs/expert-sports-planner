# 🏗️ Estructura del Módulo Admin/CRM

Módulo completamente separado para el panel de administración del sistema.

## 📁 Estructura

```
src/admin/
├── components/          # Componentes específicos del admin
│   ├── modals/         # Modales para CRUD
│   │   ├── EquipmentModal.jsx
│   │   └── ExerciseModal.jsx
│   ├── Overview.jsx    # Dashboard principal
│   ├── UserManagement.jsx
│   ├── ExerciseDatabase.jsx
│   ├── EquipmentManager.jsx
│   └── Analytics.jsx
├── hooks/              # Custom hooks del admin
│   ├── useEquipment.js
│   ├── useCustomExercises.js
│   ├── useAdminStats.js
│   └── index.js
├── pages/              # Páginas principales
│   └── AdminDashboard.jsx
└── styles/             # Estilos específicos del admin
    └── admin.css
```

## 🔄 Flujo de Datos

1. **Hooks** gestionan el estado y la lógica de negocio
2. **Components** se encargan de la presentación
3. **Pages** coordinan los componentes
4. **Modals** manejan operaciones CRUD

## 🎯 Componentes Reutilizables

Los componentes compartidos (Button, Card, etc.) se importan desde `src/components/ui`.

## 📝 Uso

```jsx
// Importar el dashboard
import AdminDashboard from "./admin/pages/AdminDashboard";

// Usar en App.jsx
<AdminDashboard onExit={() => setView("selector")} />;
```

## 🔐 Consideraciones de Seguridad

- Solo usuarios con rol ADMIN pueden acceder
- Todas las operaciones CRUD validan permisos
- Los hooks manejan la persistencia en localStorage
- Listo para migrar a backend real
