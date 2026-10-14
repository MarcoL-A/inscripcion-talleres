// Datos en memoria. Se cargan al arrancar el servidor y se pierden al pararlo.
// Elegimos las plazas para poder ver los tres estados de la ficha:
// taller 1 -> varias plazas, taller 2 -> última plaza, taller 3 -> completo.

export const talleres = [
  { id: 1, titulo: 'Introducción a Docker', categoria: 'sistemas', plazas: 20, nivel: 'inicial' },
  { id: 2, titulo: 'APIs REST con Express', categoria: 'web', plazas: 2, nivel: 'avanzado' },
  { id: 3, titulo: 'Maquetación con CSS Grid', categoria: 'web', plazas: 1, nivel: 'inicial' }
];

export const inscripciones = [
  { id: 1, tallerId: 1, nombre: 'Curro Ximénez', email: 'currox@example.com' },
  { id: 2, tallerId: 2, nombre: 'Lucía Pérez', email: 'lucia@example.com' },
  { id: 3, tallerId: 3, nombre: 'Ana Ruiz', email: 'ana@example.com' }
];
