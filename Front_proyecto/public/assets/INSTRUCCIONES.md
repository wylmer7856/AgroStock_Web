# 📁 Instrucciones para Agregar Assets

## 🎯 Ubicación de Archivos

Todos los recursos estáticos deben ir en la carpeta `public/assets/`

## 📂 Estructura de Carpetas

```
public/assets/
├── images/
│   ├── logo/          ← COLOCA AQUÍ TU LOGO
│   ├── productos/     ← Imágenes de productos
│   ├── usuarios/      ← Avatares y fotos de perfil
│   └── banners/       ← Banners promocionales
├── icons/             ← Iconos SVG personalizados
├── json/              ← Datos JSON estáticos
├── fonts/             ← Fuentes personalizadas
└── 404/               ← Recursos para página 404
```

## 🖼️ Logo de AgroStock

### Ubicación
Coloca tu logo en: `public/assets/images/logo/`

### Nombres recomendados:
- `agrostock-logo.png` - Logo principal (PNG)
- `agrostock-logo.svg` - Logo vectorial (recomendado)
- `agrostock-icon.png` - Icono pequeño
- `agrostock-favicon.ico` - Favicon para el navegador

### Tamaños sugeridos:
- Logo principal: 400x200px o 800x400px
- Icono: 200x200px o 256x256px
- Favicon: 32x32px o 64x64px

## 📸 Imágenes de Productos

### Ubicación
`public/assets/images/productos/`

### Recomendaciones:
- Formato: JPG (fotos) o PNG (ilustraciones)
- Tamaño: 800x600px o 1200x900px
- Peso: Máximo 500KB por imagen
- Nombres descriptivos: `maiz-premium.jpg`, `fertilizante-organico.png`

## 👤 Imágenes de Usuarios

### Ubicación
`public/assets/images/usuarios/`

### Tamaños:
- Avatar: 200x200px
- Banner de perfil: 1200x300px

## 📄 Archivos JSON

### Ubicación
`public/assets/json/`

### Archivos disponibles:
- `ejemplo-productos.json` - Ejemplo de productos
- `categorias.json` - Categorías de productos
- `404-message.json` - Mensaje personalizado para página 404

## 🚫 Página 404

### Ubicación
`public/assets/404/`

### Archivos:
- `404-illustration.svg` - Ilustración para página 404 (ya incluida)

## 💻 Cómo Usar los Assets en el Código

### Importar utilidades:
```typescript
import { getLogoPath, getProductImagePath, loadJsonAsset } from '../utils/assets';
```

### Usar el logo:
```tsx
<img src={getLogoPath('logo')} alt="AgroStock Logo" />
```

### Usar imagen de producto:
```tsx
<img src={getProductImagePath('maiz-premium.jpg')} alt="Maíz" />
```

### Cargar JSON:
```typescript
const productos = await loadJsonAsset('ejemplo-productos.json');
```

## ✅ Checklist

- [ ] Logo principal agregado en `images/logo/`
- [ ] Icono agregado en `images/logo/`
- [ ] Favicon agregado en `images/logo/`
- [ ] Imágenes de productos agregadas en `images/productos/`
- [ ] Imágenes de placeholder agregadas (opcional)
- [ ] JSON de datos personalizados agregados (opcional)

## 📝 Notas Importantes

1. **Todos los archivos aquí son públicos** - Cualquiera puede acceder a ellos
2. **Optimiza las imágenes** - Usa herramientas como TinyPNG antes de subirlas
3. **Usa rutas relativas** - El código ya está configurado para usar `/assets/`
4. **Nombres descriptivos** - Usa nombres claros y sin espacios
5. **Formato consistente** - Mantén el mismo formato para archivos similares

## 🎨 Recursos Recomendados

- [TinyPNG](https://tinypng.com/) - Optimizar imágenes
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - Optimizar SVG
- [Favicon Generator](https://realfavicongenerator.net/) - Generar favicons




<<<<<<< HEAD

=======
>>>>>>> 981c03b2e72622b605b6649da12a5fbfd455951e






