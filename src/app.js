import express from 'express';
import { talleres, inscripciones } from './datos.js';
import {
  normalizarInscripcion,
  validarInscripcion,
  obtenerPlazasRestantes,
  estaInscrito,
  obtenerEstado,
  anadirPlazas,
  filtrarTalleres,
  siguienteId
} from './utilidades/talleres.js';

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware: van antes de las rutas
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Registro de peticiones (sesión 2)
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(req.method, req.originalUrl, res.statusCode, `${duracion} ms`);
  });
  next();
});

// Listado con filtros
app.get('/talleres', (req, res) => {
  const categoria = String(req.query.categoria ?? '').trim().toLocaleLowerCase('es');
  const nivel = String(req.query.nivel ?? '').trim().toLocaleLowerCase('es');
  const soloDisponibles = req.query.disponibles === 'true';

  const conPlazas = anadirPlazas(talleres, inscripciones);
  const resultado = filtrarTalleres(conPlazas, categoria, nivel, soloDisponibles);

  return res.render('talleres', {
    tituloPagina: 'Talleres',
    talleres: resultado,
    filtros: { categoria, nivel, soloDisponibles }
  });
});

// Ficha de un taller
app.get('/talleres/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).render('error', {
      tituloPagina: 'Identificador no válido',
      mensaje: 'El identificador debe ser un número entero positivo'
    });
  }

  const taller = talleres.find((item) => item.id === id);
  if (!taller) {
    return res.status(404).render('error', {
      tituloPagina: 'Taller no encontrado',
      mensaje: 'No existe un taller con ese identificador'
    });
  }

  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);

  return res.render('taller', {
    tituloPagina: taller.titulo,
    taller,
    plazasRestantes,
    estado: obtenerEstado(plazasRestantes),
    inscrito: req.query.inscrito === '1'
  });
});

// Formulario de inscripción
app.get('/talleres/:id/inscripcion', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).render('error', {
      tituloPagina: 'Identificador no válido',
      mensaje: 'El identificador debe ser un número entero positivo'
    });
  }

  const taller = talleres.find((item) => item.id === id);
  if (!taller) {
    return res.status(404).render('error', {
      tituloPagina: 'Taller no encontrado',
      mensaje: 'No existe un taller con ese identificador'
    });
  }

  return res.render('inscripcion', {
    tituloPagina: 'Inscripción',
    taller,
    plazasRestantes: obtenerPlazasRestantes(taller, inscripciones),
    valores: { nombre: '', email: '' },
    errores: {}
  });
});

// Alta de la inscripción
app.post('/talleres/:id/inscripcion', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).render('error', {
      tituloPagina: 'Identificador no válido',
      mensaje: 'El identificador debe ser un número entero positivo'
    });
  }

  const taller = talleres.find((item) => item.id === id);
  if (!taller) {
    return res.status(404).render('error', {
      tituloPagina: 'Taller no encontrado',
      mensaje: 'No existe un taller con ese identificador'
    });
  }

  const valores = normalizarInscripcion(req.body ?? {});
  const errores = validarInscripcion(valores);
  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);

  if (plazasRestantes === 0) {
    errores.general = 'El taller está completo';
  }
  if (estaInscrito(inscripciones, taller.id, valores.email)) {
    errores.email = 'Este correo ya está inscrito en este taller';
  }

  if (Object.keys(errores).length > 0) {
    return res.status(400).render('inscripcion', {
      tituloPagina: 'Inscripción',
      taller,
      plazasRestantes,
      valores,
      errores
    });
  }

  inscripciones.push({
    id: siguienteId(inscripciones),
    tallerId: taller.id,
    ...valores
  });

  // Post Redirect Get
  return res.redirect(303, `/talleres/${taller.id}?inscrito=1`);
});

// 404 al final, después de todas las rutas
app.use((req, res) => {
  res.status(404).render('error', {
    tituloPagina: 'Página no encontrada',
    mensaje: 'La ruta solicitada no existe'
  });
});

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000/talleres');
});
