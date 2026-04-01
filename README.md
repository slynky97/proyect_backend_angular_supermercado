# 🛒 Backend Nest Inventarios - Supermercado

Este es el backend del sistema de gestión de inventarios para un supermercado, construido utilizando el framework [NestJS](https://nestjs.com/).

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu sistema:
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (viene incluido con Node.js)
- Base de Datos (ej. PostgreSQL, MySQL o MongoDB, según esté configurado en el proyecto)

## ⚙️ Configuración de Variables de Entorno

Para el correcto funcionamiento de las conexiones (Base de Datos, JWT, etc.), es necesario configurar las variables de entorno.

1. **Entorno de Desarrollo:**
   - Copia el archivo `.example.development.env` y pégalo o renómbralo como `.development.env`.
   - Modifica los valores dentro de `.development.env` según tu configuración local de base de datos y puertos.

2. **Entorno de Producción:**
   - Copia el archivo `.example.production.env` y pégalo o renómbralo como `.production.env`.
   - Modifica los valores para la configuración de tu servidor de despliegue.

## 🚀 Instalación

1. Clona este repositorio o descarga el código fuente.
2. Abre una terminal en la raíz del proyecto.
3. Instala las dependencias ejecutando:

```bash
npm install
```

## 🛠️ Ejecución del Proyecto

Puedes ejecutar la aplicación en diferentes modos:

```bash
# Modo desarrollo
npm run start

# Modo "watch" (recarga automática al guardar cambios, ideal para desarrollo local)
npm run start:dev

# Modo producción
npm run start:prod
```

## 🧪 Pruebas (Testing)

El proyecto cuenta con scripts preparados para ejecutar pruebas automatizadas:

```bash
# Pruebas unitarias
npm run test

# Pruebas End-to-End (e2e)
npm run test:e2e

# Reporte de cobertura de código
npm run test:cov
```

## 📦 Construcción (Build)

Para compilar el proyecto y generar la versión para producción (se creará una carpeta `dist/`):

```bash
npm run build
```

---
*Desarrollado con [NestJS](https://nestjs.com/).*
