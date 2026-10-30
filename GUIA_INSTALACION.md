# 📺 Guía de Instalación en TV LG LF6350 (webOS 2.0)
## Aplicación: Canales Nacionales Perú IPTV

Esta aplicación fue desarrollada cumpliendo estrictamente los estándares de **webOS 2.0 (Chromium 38)** del televisor **LG LF6350**, garantizando compatibilidad total con el reproductor nativo y el control remoto tradicional o Magic Remote.

---

### 📦 Archivo de Instalación Generado
El instalador oficial se encuentra listo en esta carpeta:
- **`com.peru.canales.nacionales_1.0.0_all.ipk`** (19 KB)

---

### 📡 Canales Incluidos (38 en total)

**Nacionales (01-08):** Latina TV, América TV, TV Perú, Exitosa TV, RPP Noticias, Panamericana TV, ATV, Willax TV

**Cine y Series (12-24, 29, 34-38):** HBO, Golden Edge, Golden Plus, AXN, Warner, Cine Premium, Maxcine, Maxcine Familia, Maxcine Kids, Megacine, AVI Rewinds, De Película, Cine Hispano, Cine Familiar, Maxcine 2, MyTime Movie México, My Time Spain, CMaxcine Comedy, Claro Cinema

**Documentales (09, 25):** Discovery Channel, Animal Planet

**Infantil (10, 26):** Disney Channel, Tooncast

**Deportes (11):** L1 Max

**Música y Variedades (27-28, 30-33):** Energeek Web, Energeek Fan, HTV, Teleangol, Supercable TV, Super Canal

---

### 🚀 Métodos para Instalar el archivo `.ipk` en tu Smart TV LG

#### MÉTODO 1 (Recomendado y más fácil): Con "webOS Dev Manager" (Interfaz Gráfica)
1. **En tu televisor LG:**
   - Abre la **LG Content Store** y busca la aplicación **Developer Mode**.
   - Instálala, ábrela e inicia sesión con una cuenta gratuita de LG Developer (si no tienes una, créala en 2 minutos en [webostv.developer.lge.com](https://webostv.developer.lge.com/)).
   - Activa la opción **Dev Mode Status: ON**. La TV se reiniciará.
   - Vuelve a abrir la app **Developer Mode** y activa **Key Server: ON**.
   - Anota la dirección **IP** de tu TV y la **Passphrase** (clave de 6 letras/números).

2. **En tu PC:**
   - Descarga e instala **webOS Dev Manager** para Windows (gratuito y de código abierto desde GitHub).
   - Ábrelo, haz clic en **Add Device** y escribe:
     - **IP**: La IP de tu TV.
     - **Passphrase**: La clave que te mostró la TV.
   - Haz clic en **Connect**.
   - En la pestaña **Apps**, haz clic en el botón **Install** (o arrastra el archivo `com.peru.canales.nacionales_1.0.0_all.ipk`).
   - ¡Listo! En segundos aparecerá el icono de **"Canales Nacionales Perú"** en la barra inferior de tu televisor.

---

#### MÉTODO 2: Con la Consola webOS CLI (`ares-install`)
Como ya tienes instalado `webOS CLI` en tu computadora, puedes instalarla por comando:

1. Configura tu TV una sola vez:
   ```powershell
   ares-setup-device
   ```
   (Elige `add`, ponle nombre `tv`, escribe la IP de tu TV y el puerto por defecto 9922).

2. Vincula la clave de seguridad:
   ```powershell
   ares-novacom --device tv --getkey
   ```
   (Te pedirá la Passphrase que sale en la pantalla de la TV).

3. Instala la aplicación directamente:
   ```powershell
   ares-install --device tv com.peru.canales.nacionales_1.0.0_all.ipk
   ```
   ¡Y listo!

---

#### MÉTODO 3: Mediante Homebrew Channel (Si tu TV tiene Root o Homebrew)
1. Si tienes instalado el **webOS Homebrew Channel**:
   - Abre el Homebrew Channel en tu TV.
   - Ve a configuración y activa el servidor web local.
   - Abre la IP indicada desde tu navegador en la PC y sube el archivo `.ipk`.

---

### 🎮 Controles en el Control Remoto de tu TV LG

| Botón del Control | Función en la Aplicación |
| :--- | :--- |
| **◄ / ► (Izquierda / Derecha)** | Moverse entre los canales con efecto luminoso y sonido visual. |
| **OK / Enter** | **Abrir reproductor y transmitir canal** en pantalla completa. |
| **ATRÁS / Back (Código 461)** | **Salir del reproductor** y volver al menú principal de canales. |
| **CH ▲ / CH ▼** o **▲ / ▼** | **Zapping rápido:** Cambia al canal siguiente o anterior mientras miras la tele. |
| **1 al 5** | Sintonía directa al número de canal. |
| **Puntero Magic Remote** | Puedes apuntar y hacer clic en cualquier canal con el cursor en pantalla. |

---

### 🛠️ ¿Cómo agregar o cambiar enlaces en el futuro?
1. Abre el archivo [`js/channels.js`](file:///i:/ANTIGRAVITY%20PROJECTS%202027%20REDY/CANALES%20NACIONALES%20APP%20WEBOS/js/channels.js).
2. Modifica o agrega la URL del canal que desees.
3. Haz doble clic en el archivo [`empaquetar.bat`](file:///i:/ANTIGRAVITY%20PROJECTS%202027%20REDY/CANALES%20NACIONALES%20APP%20WEBOS/empaquetar.bat) y automáticamente se creará el nuevo `.ipk` actualizado.
