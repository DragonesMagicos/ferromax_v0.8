# Ferromax ERP

Sistema ERP para ferretería con módulos de ventas, inventario, POS y tienda online.

## Stack tecnológico

- **Backend:** Java 17 + Spring Boot 3.2.5 + PostgreSQL 16
- **Frontend:** React + Vite
- **Seguridad:** JWT
- **Tiempo real:** WebSocket STOMP

## Requisitos previos

- Java 17+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 16

## Configuración inicial

### 1. Base de datos

Crear la base de datos en PostgreSQL y configurar las credenciales en `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ferromax
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_PASSWORD
```

### 2. Imágenes de productos

Las imágenes no están incluidas en el repositorio por su tamaño (~213 MB). Copiarlas manualmente a:

```
ferromax-web/public/img/
```

Solicitar el archivo comprimido `img.zip` al equipo de desarrollo y descomprimir en esa carpeta.

### 3. Backend

```bash
mvn spring-boot:run
```

Servidor disponible en `http://localhost:8081/api`

### 4. Frontend

```bash
cd ferromax-web
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`

## Usuarios por defecto

| Usuario | Contraseña | Rol |
|---|---|---|
|  jose@ferromax.com | admin123 | Administrador |
| manuel@ferromax.com | emp123 | Empleado |
