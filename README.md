# Sistema de inscripción a talleres

Práctica UD1 de Desarrollo Web en Entorno Servidor. Aplicación Express + EJS que gestiona los talleres de unas jornadas tecnológicas.

**Autor:** Marco López Alonso
**Chat de apoyo con IA:** https://claude.ai/share/8ea130d3-44cb-4f94-b63b-766db9c10d10

## Cómo ejecutarlo

```bash
npm install
npm run dev     # con nodemon (se reinicia al guardar)
# o
npm start
```

Abre http://localhost:3000/talleres

## Estructura

```
src/
  app.js                  -> configuración de Express, middleware y rutas
  datos.js                -> arrays talleres e inscripciones (3 de cada al arrancar)
  utilidades/talleres.js  -> funciones de lógica (no usan req ni res)
views/
  partials/cabecera.ejs, pie.ejs
  talleres.ejs            -> listado con filtros
  taller.ejs              -> ficha del taller
  inscripcion.ejs         -> formulario de inscripción
  error.ejs               -> páginas 400 / 404
public/css/estilos.css    -> recurso estático (/css/estilos.css)
```

## Cómo se ha hecho cada funcionalidad

### 1. Listado y filtros (`GET /talleres`)
La ruta lee `categoria`, `nivel` y `disponibles` de `req.query` y los normaliza con `String`, `trim` y `toLocaleLowerCase('es')`, de modo que ` WEB ` se trata igual que `web`. `anadirPlazas()` usa `map()` para añadir a cada taller sus plazas restantes y su estado, y `filtrarTalleres()` aplica los filtros uno detrás de otro con `filter()`. Así se pueden combinar y nunca se modifica el array original. La vista recorre el resultado con un `for...of` y distingue cero, uno o varios resultados.

### 2. Plazas restantes
`obtenerPlazasRestantes(taller, inscripciones)` filtra con `filter()` las inscripciones de ese taller y resta: `plazas - inscripciones.length`.

### 3. Ficha (`GET /talleres/:id`)
El id se convierte con `Number(req.params.id)`. Convertir no basta, porque `-1`, `0` o `1.5` también son números, así que se comprueba con `Number.isInteger(id)` y `id <= 0`. Si no es válido, devuelve **400**. Si es válido pero no existe (`find()` devuelve `undefined`), devuelve **404**. `obtenerEstado()` devuelve el texto según las plazas (`N plazas disponibles`, `Última plaza disponible` o `Completo`) y la vista muestra cada estado de forma distinta, con colores diferentes y con o sin botón de inscripción.

### 4. Formulario de inscripción (`GET /talleres/:id/inscripcion`)
Muestra el formulario vacío. Comprueba el id igual que la ficha.

### 5. Alta (`POST /talleres/:id/inscripcion`)
- `express.urlencoded` (registrado antes de las rutas) convierte el formulario en `req.body`.
- Todo lo que llega del navegador se trata como no fiable. `normalizarInscripcion()` lo pasa a texto con `String`, `trim` y `toLocaleLowerCase('es')` (este último solo para el correo). `validarInscripcion(datos)` comprueba que el nombre tenga entre 2 y 60 caracteres y que el correo no esté vacío y contenga una `@` (`includes('@')`). Es una comprobación básica: no revisa el dominio.
- Se comprueba que quedan plazas y, con `estaInscrito(tallerId, email, inscripciones)` (usa `some()`), que el correo no esté ya inscrito en ese taller.
- Si hay errores (`Object.keys(errores).length > 0`), responde **400** y vuelve a mostrar el formulario con los valores escritos y un mensaje junto a cada campo.
- Si todo es correcto, añade la inscripción con `push()` y aplica **PRG**: responde **303** hacia `/talleres/:id?inscrito=1`. Al recargar solo se repite el GET, no la inscripción.

### Otros detalles
- Todos los datos se muestran con `<%= %>` (salida escapada), así que el HTML que escriba el usuario aparece como texto y no se ejecuta (XSS).
- Middleware de registro que muestra en la terminal el método, la URL, el código y la duración de cada petición.
- Ruta 404 al final, después de todas las rutas.
- El id de cada inscripción nueva lo calcula `siguienteId()`: el mayor id + 1.

## Pruebas con curl

> **Importante:** los datos están en memoria. Al reiniciar el servidor vuelven los datos iniciales: el taller 1 tiene plazas, al taller 2 le queda la última plaza y el taller 3 está completo.
>
> **Orden de las pruebas:** ejecútalas en el orden en que aparecen. Después de la inscripción correcta en el taller 2, ese taller pasa a estar completo, así que si se repite ese curl devolverá **400** en lugar de 303. Para volver a probarlo, reinicia el servidor.

**Listado y filtros** (en HTML: formulario de filtros de `/talleres`)
```bash
curl -i http://localhost:3000/talleres
curl -i "http://localhost:3000/talleres?categoria=web"
curl -i "http://localhost:3000/talleres?nivel=avanzado"
curl -i "http://localhost:3000/talleres?disponibles=true"
curl -i "http://localhost:3000/talleres?categoria=web&disponibles=true"
curl -i "http://localhost:3000/talleres?categoria=web&nivel=avanzado&disponibles=true"
```

**Normalización de filtros** (en HTML: escribir ` WEB ` con espacios en el campo Categoría)
```bash
# Espacios y mayúsculas -> devuelve los 2 talleres web
curl -i "http://localhost:3000/talleres?categoria=%20WEB%20"
```

**Ficha y sus tres estados** (en HTML: enlaces del listado)
```bash
curl -i http://localhost:3000/talleres/1   # 19 plazas disponibles
curl -i http://localhost:3000/talleres/2   # Última plaza disponible
curl -i http://localhost:3000/talleres/3   # Completo
```

**Identificador manipulado** (en HTML: escribir la URL a mano en el navegador)
```bash
curl -i http://localhost:3000/talleres/abc    # 400 (no es un número)
curl -i http://localhost:3000/talleres/-1     # 400 (negativo)
curl -i http://localhost:3000/talleres/0      # 400 (cero)
curl -i http://localhost:3000/talleres/1.5    # 400 (no es entero)
curl -i http://localhost:3000/talleres/999    # 404 (válido pero no existe)
curl -i -X POST http://localhost:3000/talleres/abc/inscripcion   # 400
```

**Formulario de inscripción** (en HTML: botón "Inscribirme" de la ficha)
```bash
curl -i http://localhost:3000/talleres/1/inscripcion
```

**Inscripción con errores** (en HTML: enviar el formulario con esos datos)
```bash
# Nombre y correo vacíos -> 400
curl -i -X POST -d "nombre=&email=" http://localhost:3000/talleres/1/inscripcion
# Correo sin @ -> 400, conserva el nombre escrito
curl -i -X POST -d "nombre=Marco&email=marco" http://localhost:3000/talleres/1/inscripcion
# Correo ya inscrito en ese taller (también con mayúsculas) -> 400
curl -i -X POST -d "nombre=Curro&email=CurroX@example.com" http://localhost:3000/talleres/1/inscripcion
# Taller completo -> 400
curl -i -X POST -d "nombre=Pepe&email=pepe@example.com" http://localhost:3000/talleres/3/inscripcion
```

**Escape de datos (XSS)** (en HTML: escribir `<script>alert(1)</script>` como nombre y un correo sin @)
```bash
# El correo inválido fuerza el 400 y el formulario vuelve con el nombre escrito.
# En la respuesta aparece &lt;script&gt; en lugar de la etiqueta: no se ejecuta.
curl -i -X POST --data-urlencode "nombre=<script>alert(1)</script>" --data-urlencode "email=x" http://localhost:3000/talleres/1/inscripcion
```

**Inscripción correcta con PRG** (en HTML: enviar el formulario del taller 2)
```bash
curl -i -X POST -d "nombre=Marco&email=marco@example.com" http://localhost:3000/talleres/2/inscripcion
# HTTP/1.1 303 See Other
# Location: /talleres/2?inscrito=1
# Después de esto el taller 2 queda completo (ver aviso sobre el orden de las pruebas)
```

**Recurso estático y 404**
```bash
curl -i http://localhost:3000/css/estilos.css   # 200
curl -i http://localhost:3000/no-existe         # 404
```