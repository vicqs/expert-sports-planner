# Guía de Contribución

¡Gracias por tu interés en contribuir a Expert Sports Planner! Esta guía te ayudará a comenzar.

---

## 📋 Tabla de Contenidos

1. [Code of Conduct](#code-of-conduct)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Estándares de Código](#estándares-de-código)
5. [Proceso de Pull Request](#proceso-de-pull-request)
6. [Reportar Bugs](#reportar-bugs)
7. [Sugerir Features](#sugerir-features)

---

## 🤝 Code of Conduct

### Nuestro Compromiso

Nos comprometemos a hacer de este proyecto una experiencia libre de acoso para todos, independientemente de:

- Experiencia técnica
- Identidad de género
- Orientación sexual
- Discapacidad
- Apariencia física
- Etnia
- Edad
- Religión

### Comportamiento Esperado

✅ **SI:**

- Usar lenguaje acogedor e inclusivo
- Respetar puntos de vista diferentes
- Aceptar críticas constructivas
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

❌ **NO:**

- Usar lenguaje o imágenes sexualizadas
- Comentarios despectivos o ataques personales
- Acoso público o privado
- Publicar información privada sin permiso
- Conducta no profesional

---

## 🚀 Cómo Contribuir

### Tipos de Contribuciones

1. **🐛 Reportar Bugs**
   - Usando el issue tracker
   - Con reproducción clara del problema

2. **💡 Sugerir Features**
   - Propuestas bien documentadas
   - Casos de uso claros

3. **📝 Mejorar Documentación**
   - Corregir typos
   - Añadir ejemplos
   - Traducir contenido

4. **💻 Código**
   - Nuevas features
   - Corrección de bugs
   - Refactorización
   - Tests

5. **🎨 Diseño**
   - UI/UX improvements
   - Iconos y assets
   - Temas y estilos

---

## ⚙️ Configuración del Entorno

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 o pnpm >= 8.0.0
- Git

### Instalación

```bash
# 1. Fork el repositorio en GitHub

# 2. Clonar tu fork
git clone https://github.com/TU_USUARIO/expert-sports-planner.git
cd expert-sports-planner

# 3. Añadir upstream remote
git remote add upstream https://github.com/ORIGINAL/expert-sports-planner.git

# 4. Instalar dependencias
npm install

# 5. Copiar archivo de variables de entorno (si existe)
cp .env.example .env

# 6. Iniciar servidor de desarrollo
npm run dev
```

### Verificar Instalación

```bash
# Ejecutar linter
npm run lint

# Ejecutar tests (cuando estén implementados)
npm test

# Build para producción
npm run build
```

---

## 📏 Estándares de Código

### Estilo de Código

Usamos **ESLint** y **Prettier** para mantener consistencia.

```bash
# Verificar estilo
npm run lint

# Auto-fix problemas
npm run lint:fix

# Formatear con Prettier
npm run format
```

### Convenciones de Nombres

#### Componentes

```jsx
// PascalCase para componentes
const UserProfile = () => {};
const PlanEditor = () => {};
```

#### Funciones y Variables

```javascript
// camelCase para funciones y variables
const getUserById = (id) => {};
const isActive = true;
```

#### Constantes

```javascript
// UPPER_SNAKE_CASE para constantes
const API_BASE_URL = "https://api.example.com";
const MAX_RETRIES = 3;
```

#### Archivos

```
ComponentName.jsx  // Componentes
utilityName.js     // Utilities
feature-name.css   // Estilos
```

### Estructura de Componentes

```jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// Importar dependencias externas primero
import { motion } from "framer-motion";

// Luego dependencias internas
import { Button, Card } from "./ui";
import { useAuth } from "../hooks/useAuth";

// Por último, estilos
import "./ComponentName.css";

/**
 * Descripción del componente
 * @param {Object} props - Props del componente
 */
const ComponentName = ({ prop1, prop2, ...rest }) => {
  // 1. Hooks
  const [state, setState] = useState(initialValue);
  const customHook = useCustomHook();

  // 2. Efectos
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 3. Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 4. Render helpers
  const renderItem = (item) => {
    return <div>{item.name}</div>;
  };

  // 5. Early returns
  if (!prop1) return null;

  // 6. Main render
  return <div className="component-name">{/* JSX */}</div>;
};

// PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// Default props
ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

### Estructura de Commits

Usamos **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formato, sin cambios en lógica
- `refactor`: Refactorización de código
- `test`: Añadir o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**

```bash
feat(plan-editor): add drag and drop for exercises

fix(auth): correct token expiration validation

docs(readme): update installation instructions

refactor(utils): extract storage logic to separate file

test(generator): add unit tests for plan generation

chore(deps): update dependencies to latest versions
```

---

## 🔄 Proceso de Pull Request

### 1. Crear Branch

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear feature branch
git checkout -b feat/amazing-feature
# o
git checkout -b fix/bug-description
```

### 2. Hacer Cambios

```bash
# Hacer commits atómicos
git add .
git commit -m "feat(component): add new feature"

# Múltiples commits si es necesario
git commit -m "refactor(component): extract helper function"
git commit -m "test(component): add unit tests"
```

### 3. Mantener Actualizado

```bash
# Fetch upstream changes
git fetch upstream

# Rebase sobre main
git rebase upstream/main
```

### 4. Push y Crear PR

```bash
# Push a tu fork
git push origin feat/amazing-feature

# Crear PR en GitHub con:
# - Título descriptivo
# - Descripción detallada
# - Screenshots (si aplica)
# - Tests realizados
# - Checklist completado
```

### Template de PR

```markdown
## Descripción

Descripción clara de los cambios realizados.

## Tipo de Cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha testeado?

Describe las pruebas realizadas.

## Screenshots (si aplica)

Adjunta imágenes de los cambios UI.

## Checklist

- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado self-review
- [ ] He comentado código complejo
- [ ] He actualizado documentación
- [ ] Mis cambios no generan warnings
- [ ] He añadido tests
- [ ] Tests pasan localmente
- [ ] He actualizado CHANGELOG.md
```

### 5. Code Review

- Responde a comentarios constructivamente
- Realiza cambios solicitados
- Marca conversaciones como resueltas
- Be patient y professional

### 6. Merge

Una vez aprobado:

- Squash commits si es necesario
- Merge via GitHub
- Eliminar branch después del merge

```bash
# Limpiar branches locales
git branch -d feat/amazing-feature

# Limpiar branches remotos
git push origin --delete feat/amazing-feature
```

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. **Busca** en issues existentes
2. **Actualiza** a la última versión
3. **Reproduce** el bug consistentemente

### Template de Bug Report

```markdown
## Descripción del Bug

Descripción clara y concisa del bug.

## Pasos para Reproducir

1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

## Comportamiento Esperado

Qué debería suceder.

## Comportamiento Actual

Qué está sucediendo.

## Screenshots

Si aplica, añade screenshots.

## Entorno

- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 125]
- Node Version: [e.g., 18.17.0]
- Version: [e.g., 2.0.0]

## Contexto Adicional

Cualquier información relevante.

## Logs
```

Pegar logs relevantes aquí

```

```

---

## 💡 Sugerir Features

### Template de Feature Request

```markdown
## Feature Solicitada

Descripción clara de la feature.

## Problema que Resuelve

¿Qué problema resuelve? ¿Por qué es útil?

## Solución Propuesta

Cómo debería funcionar.

## Alternativas Consideradas

Otras soluciones que consideraste.

## Mockups/Ejemplos

Cualquier diseño o ejemplo de referencia.

## Prioridad

- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low
```

---

## 🧪 Testing

### Escribir Tests

```jsx
// ComponentName.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentName from "./ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("handles click event", () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## 📚 Recursos Útiles

### Documentación

- [README.md](../README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CODE_SMELLS.md](./CODE_SMELLS.md)
- [BEST_PRACTICES.md](./BEST_PRACTICES.md)

### Tutoriales

- [React Docs](https://react.dev/)
- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Herramientas

- [GitHub Desktop](https://desktop.github.com/)
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

## 🙋 Preguntas Frecuentes

### ¿Cuánto tiempo toma aprobar un PR?

Generalmente 2-5 días hábiles. Ten paciencia.

### ¿Puedo trabajar en múltiples issues?

Sí, pero crea branches separados para cada uno.

### ¿Necesito escribir tests?

Para nuevas features, sí. Para pequeños bug fixes, es opcional pero recomendado.

### ¿Puedo contribuir si soy principiante?

¡Absolutamente! Busca issues con label `good-first-issue`.

---

## 📞 Contacto

- GitHub Issues: [github.com/usuario/repo/issues](https://github.com)
- Discussions: [github.com/usuario/repo/discussions](https://github.com)
- Email: proyecto@example.com

---

## 🎉 Reconocimientos

Todos los contribuidores serán reconocidos en:

- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Release notes
- README.md

¡Gracias por contribuir!

---

**Última actualización:** 24 de febrero de 2026
