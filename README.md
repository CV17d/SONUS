# SONUS - Experiencia Musical Inmersiva 💎🎧

**Sonus** no es solo un reproductor de música; es un santuario digital diseñado para la escucha consciente. Construido con una arquitectura de vanguardia y un sistema de diseño propio, Sonus transforma cada pista en una experiencia sensorial profunda.

![Sonus Preview](https://github.com/CV17d/SONUS/raw/main/public/preview.png) *(Nota: Imagen de previsualización pendiente de añadir)*

## ✨ Características Destacadas

### 🌌 Sistema de Diseño "Sonic Etherealism"
Inspirado por la aurora digital, nuestro sistema de diseño rompe con las interfaces tradicionales:
- **Regla No-Line**: Cero bordes sólidos. La estructura se define por profundidad tonal y capas de luz.
- **Glassmorphism Maestro**: Paneles de cristal con desenfoques de hasta 32px que permiten que la energía del color fluya a través de la interfaz.
- **Tipografía Editorial**: Una combinación sofisticada de *Plus Jakarta Sans* (para impacto) y *Manrope* (para legibilidad) con kerning ajustado.

### 🧘 Modo Zen (Enfoque Total)
Un entorno purificado de distracciones. Al activar el Modo Zen (tecla `Z`), la interfaz secundaria se desvanece, dejando el escenario principal dedicado exclusivamente al arte del disco, los controles esenciales y la lírica.

### ⚡ Energía en Tiempo Real
El fondo dinámico inteligente utiliza el `AnalyserNode` de la Web Audio API para monitorizar las frecuencias bajas. El ambiente de la aplicación vibra y late físicamente en sincronía con los bajos de la música.

### 🔍 Autocover & Lyrics Inteligentes
Sonus se encarga de que tu colección siempre luzca perfecta:
- **iTunes Cover Engine**: Búsqueda automática y recuperación de carátulas en alta resolución (600x600px).
- **Lyrics View**: Visualizador de letras integrado para una conexión narrativa total con el artista.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript.
- **Herramienta de Construcción**: Vite (Velocidad de desarrollo instantánea).
- **Animaciones**: Framer Motion (Efectos líquidos, transiciones de entrada/salida y gestos).
- **Motor de Audio**: 
  - Gestión mediante **DLL (Lista Doblemente Enlazada)** para una navegación de pistas robusta.
  - Algoritmo de **Crossfade** integrado para transiciones suaves entre canciones.
- **Almacenamiento**: Persistencia robusta en el navegador utilizando **IndexedDB**.

## ⌨️ Atajos de Teclado
- `Espacio`: Play / Pause.
- `Flecha Derecha / Izquierda`: Salto rápido de +/- 10 segundos.
- `Z`: Alternar Modo Zen / Enfoque.

## 🚀 Guía de Inicio

### Requisitos Previos
- Node.js (v16 o superior)
- npm o yarn

### Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/CV17d/SONUS.git
   ```
2. Entra en el directorio:
   ```bash
   cd sonus
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Lanza la aplicación:
   ```bash
   npm run dev
   ```

---
Desarrollado con pasión para elevar el estándar de la reproducción musical web. 💿✨
