# 📁 GitHub Actions — Workflows del Proyecto

Esta carpeta contiene dos automatizaciones que se ejecutan **en los servidores de GitHub** (no en tu máquina local, no en Supabase).

---

## 📋 Índice

- [¿Qué es GitHub Actions?](#qué-es-github-actions)
- [Workflow 1 — Supabase Keepalive](#workflow-1--supabase-keepalive-supabase-keepaliveyml)
- [Workflow 2 — CI Build & Test](#workflow-2--ci-build--test-ciyml)
- [Configuración paso a paso](#configuración-paso-a-paso)
- [Cómo ejecutar manualmente](#cómo-ejecutar-manualmente)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## ¿Qué es GitHub Actions?

GitHub Actions es un servicio **gratuito** de GitHub que ejecuta scripts automáticamente en respuesta a eventos. Los scripts se llaman *workflows* y viven en esta carpeta `.github/workflows/`.

```
Tu repo en GitHub
      │
      ▼
GitHub detecta el evento (push, cron, etc.)
      │
      ▼
GitHub lanza una máquina virtual Ubuntu
      │
      ▼
Ejecuta los pasos definidos en el .yml
      │
      ▼
Reporta éxito ✅ o fallo ❌ en la pestaña "Actions"
```

**Todo ocurre en la nube de GitHub. No necesitas tener tu PC encendida.**

---

## Workflow 1 — Supabase Keepalive (`supabase-keepalive.yml`)

### ¿Para qué sirve?

Supabase en el plan **gratuito pausa tu base de datos** si no recibe actividad durante **7 días**. Este workflow hace un ping automático a tu app cada 5 días para evitarlo.

### ¿Cómo funciona?

```
Cada 5 días a las 12:00 UTC
        │
        ▼
GitHub llama a: GET https://tu-app.vercel.app/api/keepalive
        │          con header: Authorization: Bearer TU_CRON_SECRET
        ▼
Tu app Next.js recibe la petición
        │
        ▼
El endpoint /api/keepalive hace un SELECT a Supabase
        │
        ▼
Supabase recibe actividad → NO se suspende ✅
```

### Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `.github/workflows/supabase-keepalive.yml` | El cron job (aquí en GitHub) |
| `client/app/api/keepalive/route.ts` | El endpoint en tu app Next.js |
| `client/lib/supabaseAdmin.ts` | El cliente Supabase usado por el endpoint |

### Variables de entorno necesarias

El workflow necesita dos **Secrets de GitHub** (no se guardan en el código):

| Secret en GitHub | Valor |
|------------------|-------|
| `CRON_SECRET` | Una contraseña que tú inventas (ej: `mi_clave_secreta_123`) |
| `NEXT_PUBLIC_BASE_URL` | La URL de tu app desplegada (ej: `https://tu-app.vercel.app`) |

Y en tu app Vercel necesitas estas variables de entorno:

| Variable en Vercel | Valor |
|--------------------|-------|
| `CRON_SECRET` | **Exactamente el mismo** valor que pusiste en GitHub |
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | La service role key de Supabase |

---

## Workflow 2 — CI Build & Test (`ci.yml`)

### ¿Para qué sirve?

Cada vez que haces un `git push` o abres un Pull Request, GitHub automáticamente:
1. Compila el servidor TypeScript
2. Ejecuta los tests del servidor
3. Pasa el linter del cliente Next.js
4. Compila el cliente Next.js
5. Audita vulnerabilidades en dependencias

Si algo falla, te avisa antes de que llegue a producción.

### ¿Cuándo se ejecuta?

```yaml
on:
  push:
    branches: [main, master, develop]   # Al hacer push
  pull_request:
    branches: [main, master, develop]   # Al abrir un PR
```

### Variables que ya tiene configuradas (sin secrets)

El workflow CI usa valores de placeholder para compilar sin conectarse a servicios reales:

```yaml
JWT_SECRET: test_secret_at_least_32_characters_long_for_ci
SUPABASE_URL: https://placeholder.supabase.co
SUPABASE_ANON_KEY: placeholder_anon_key
```

Esto es intencional — los tests deben funcionar sin credenciales reales.

---

## Configuración paso a paso

### PASO 1 — Subir el código a GitHub

Si aún no tienes el repo en GitHub:

```bash
# En tu terminal, dentro de c:\W-PROYECTOS\client-VIAJES
git add .
git commit -m "feat: add GitHub Actions workflows"
git push origin main
```

### PASO 2 — Configurar Secrets en GitHub

1. Ve a tu repositorio en **github.com**
2. Haz clic en **Settings** (pestaña superior)
3. En el menú izquierdo: **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**

Crea estos dos secrets:

#### Secret 1: `CRON_SECRET`
```
Name:  CRON_SECRET
Value: pon-aqui-una-clave-larga-y-aleatoria-que-tu-inventes
```
> Ejemplo de valor: `keepalive_prod_2026_xK9mP3nQ7rT2vY8`  
> Puedes generarlo con: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

#### Secret 2: `NEXT_PUBLIC_BASE_URL`
```
Name:  NEXT_PUBLIC_BASE_URL
Value: https://tu-dominio-real.vercel.app
```
> Ejemplo: `https://aeroviajes.vercel.app`  
> **Sin barra al final**

### PASO 3 — Configurar variables en Vercel

1. Ve a **vercel.com** → tu proyecto
2. **Settings** → **Environment Variables**
3. Añade estas variables (para **Production**):

| Variable | Valor |
|----------|-------|
| `CRON_SECRET` | El mismo valor que pusiste en GitHub Secrets |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase (`https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | En Supabase: Settings → API → service_role key |

4. Haz un nuevo deploy para que las variables se apliquen:
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy for env vars"
   git push
   ```

### PASO 4 — Verificar que el endpoint funciona

Antes de que corra el cron, prueba manualmente desde tu navegador o terminal:

```bash
# Reemplaza con tu URL y tu CRON_SECRET
curl -H "Authorization: Bearer tu-cron-secret-aqui" \
     https://tu-app.vercel.app/api/keepalive
```

Respuesta esperada:
```json
{"ok": true, "timestamp": "2026-06-21T12:00:00.000Z"}
```

Si ves `{"ok": false, "error": "Unauthorized"}` → el CRON_SECRET no coincide.  
Si ves un error de Supabase → revisa la SERVICE_ROLE_KEY.

### PASO 5 — Verificar los workflows en GitHub

1. Ve a tu repo en GitHub
2. Haz clic en la pestaña **Actions**
3. Verás los workflows listados a la izquierda
4. El CI se habrá ejecutado automáticamente con el push del PASO 1
5. El Keepalive aparecerá pero esperará al próximo cron (cada 5 días)

---

## Cómo ejecutar manualmente

### Ejecutar el Keepalive ahora mismo

Útil para probar que todo funciona sin esperar 5 días:

1. GitHub → pestaña **Actions**
2. En el menú izquierdo → **Supabase Keepalive**
3. Botón **Run workflow** (lado derecho)
4. Selecciona branch `main`
5. Clic en **Run workflow** (verde)

![Ejemplo visual de Run workflow](https://docs.github.com/assets/cb-21036/mw-1440/images/help/actions/run-workflow-dialog.webp)

### Ejecutar el CI manualmente

Igual que arriba pero selecciona **CI — Build, Lint & Test**.

---

## Ver los logs de ejecución

1. GitHub → **Actions**
2. Haz clic en cualquier ejecución
3. Verás los jobs (`keepalive`, `server`, `client`, `security-audit`)
4. Haz clic en un job para ver el log detallado línea por línea

Un log exitoso del keepalive se ve así:
```
HTTP status: 200
✓ Supabase sigue activo
```

Un fallo se ve así:
```
HTTP status: 401
Error: Keepalive falló con HTTP 401
```

---

## Preguntas frecuentes

### ¿Cuánto cuesta?

**Gratis.** GitHub Actions tiene 2,000 minutos/mes gratuitos para repos públicos y privados. Cada ejecución del keepalive toma ~10 segundos. El CI toma ~3-5 minutos. Estás muy lejos del límite.

### ¿Tengo que tener GitHub abierto?

No. GitHub ejecuta los workflows en sus propios servidores aunque tengas el navegador cerrado y el PC apagado.

### ¿Qué pasa si el workflow falla?

GitHub te manda un email de notificación automáticamente. También puedes ver el error en la pestaña Actions.

### ¿El keepalive realmente evita que Supabase se pause?

Sí, siempre que:
1. Tu app Vercel esté desplegada y funcionando
2. Las variables de entorno estén configuradas correctamente
3. El CRON_SECRET coincida entre GitHub Secrets y Vercel

Supabase pausa proyectos sin actividad por 7 días. El ping cada 5 días deja un margen de 2 días de seguridad.

### ¿Puedo cambiar la frecuencia del ping?

Sí, edita la línea `cron` en `supabase-keepalive.yml`:

```yaml
# Formato: minuto hora día-del-mes mes día-de-semana
# Cada 5 días a mediodía:
- cron: '0 12 */5 * *'

# Cada 3 días:
- cron: '0 12 */3 * *'

# Cada día a las 8am:
- cron: '0 8 * * *'
```

> El formato es **cron estándar de Unix**. Herramienta útil: [crontab.guru](https://crontab.guru)

### ¿Y si no tengo la app desplegada en Vercel todavía?

El keepalive no funcionará porque necesita una URL real. Tienes dos opciones:

**Opción A** — Desplegar en Vercel primero (recomendado):
```bash
npm install -g vercel
cd client
vercel --prod
```

**Opción B** — Ping directo a Supabase sin pasar por tu app:

Edita `supabase-keepalive.yml` y reemplaza el paso por:
```yaml
- name: Ping directo a Supabase
  run: |
    curl -s \
      -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
      "${{ secrets.SUPABASE_URL }}/rest/v1/site_settings?select=key&limit=1"
    echo "✓ Ping enviado"
```

Y añade estos secrets en GitHub:
- `SUPABASE_URL` → tu URL de Supabase
- `SUPABASE_ANON_KEY` → tu anon key de Supabase

---

## Estructura de archivos de referencia

```
.github/
└── workflows/
    ├── README.md                    ← Este archivo
    ├── supabase-keepalive.yml       ← Cron job anti-suspensión
    └── ci.yml                       ← Pipeline CI/CD

client/
└── app/
    └── api/
        └── keepalive/
            └── route.ts             ← Endpoint que hace el ping a Supabase
```

---

*Documentación generada — Junio 2026*
