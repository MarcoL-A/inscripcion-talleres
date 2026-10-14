// Prepara los datos del formulario: los pasa a texto y quita espacios.
export function normalizarInscripcion(entrada) {
  return {
    nombre: String(entrada.nombre ?? '').trim(),
    email: String(entrada.email ?? '').trim().toLocaleLowerCase('es')
  };
}

// Devuelve un objeto con un mensaje por cada campo erróneo.
// Si está vacío, los datos son válidos.
export function validarInscripcion(datos) {
  const errores = {};

  if (datos.nombre.length < 2) {
    errores.nombre = 'Escribe al menos dos caracteres';
  }
  if (datos.nombre.length > 60) {
    errores.nombre = 'Máximo 60 caracteres';
  }
  if (!datos.email) {
    errores.email = 'El correo es obligatorio';
  } else if (!datos.email.includes('@')) {
    errores.email = 'El correo no tiene un formato válido';
  }

  return errores;
}

// plazas restantes = plazas del taller - inscripciones de ese taller
export function obtenerPlazasRestantes(taller, inscripciones) {
  const delTaller = inscripciones.filter((inscripcion) => inscripcion.tallerId === taller.id);
  return taller.plazas - delTaller.length;
}

// true si ese correo ya está inscrito en ese taller
export function estaInscrito(inscripciones, tallerId, email) {
  return inscripciones.some((inscripcion) =>
    inscripcion.tallerId === tallerId
    && inscripcion.email === email
  );
}

// Texto del estado. El orden importa: primero 0, luego 1, luego el resto.
export function obtenerEstado(plazasRestantes) {
  if (plazasRestantes === 0) {
    return 'Completo';
  }
  if (plazasRestantes === 1) {
    return 'Última plaza disponible';
  }
  return `${plazasRestantes} plazas disponibles`;
}

// Añade a cada taller sus plazas restantes y su estado (sin tocar el original).
export function anadirPlazas(talleres, inscripciones) {
  return talleres.map((taller) => {
    const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);
    return { ...taller, plazasRestantes, estado: obtenerEstado(plazasRestantes) };
  });
}

// Filtros paso a paso, como filtrarLibros de la sesión 5.
export function filtrarTalleres(talleres, categoria, nivel, soloDisponibles) {
  let resultado = talleres;

  if (categoria) {
    resultado = resultado.filter((taller) => taller.categoria === categoria);
  }
  if (nivel) {
    resultado = resultado.filter((taller) => taller.nivel === nivel);
  }
  if (soloDisponibles) {
    resultado = resultado.filter((taller) => taller.plazasRestantes > 0);
  }
  return resultado;
}

// Igual que en la sesión 6: el mayor id + 1
export function siguienteId(lista) {
  if (lista.length === 0) {
    return 1;
  }
  let maximo = 0;
  for (const elemento of lista) {
    if (elemento.id > maximo) {
      maximo = elemento.id;
    }
  }
  return maximo + 1;
}