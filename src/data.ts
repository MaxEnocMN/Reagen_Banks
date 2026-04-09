export interface Question {
  id: number;
  en: {
    pregunta: string;
    respuesta: string;
    explicacion: string;
  };
  es: {
    pregunta: string;
    respuesta: string;
    explicacion: string;
  };
}

export const questions: Question[] = [
  {
    id: 1,
    en: {
      pregunta: "What is the primary goal of Neuromarketing?",
      respuesta: "To understand consumer behavior by analyzing brain activity.",
      explicacion: "Neuromarketing uses medical technologies like fMRI to study the brain's responses to marketing stimuli."
    },
    es: {
      pregunta: "¿Cuál es el objetivo principal del Neuromarketing?",
      respuesta: "Entender el comportamiento del consumidor analizando la actividad cerebral.",
      explicacion: "El neuromarketing utiliza tecnologías médicas como la fMRI para estudiar las respuestas del cerebro a los estímulos de marketing."
    }
  },
  {
    id: 2,
    en: {
      pregunta: "What is the principle of 'Presumption of Innocence'?",
      respuesta: "The legal principle that one is considered innocent until proven guilty.",
      explicacion: "This is a fundamental right in many legal systems, placing the burden of proof on the prosecution."
    },
    es: {
      pregunta: "¿Qué es el principio de 'Presunción de Inocencia'?",
      respuesta: "El principio legal de que uno es considerado inocente hasta que se demuestre lo contrario.",
      explicacion: "Este es un derecho fundamental en muchos sistemas legales, que pone la carga de la prueba en la fiscalía."
    }
  },
  {
    id: 3,
    en: {
      pregunta: "What does the 'Heisenberg Uncertainty Principle' state?",
      respuesta: "It is impossible to know both the exact position and momentum of a particle simultaneously.",
      explicacion: "The more precisely the position of some particle is determined, the less precisely its momentum can be known, and vice versa."
    },
    es: {
      pregunta: "¿Qué establece el 'Principio de Incertidumbre de Heisenberg'?",
      respuesta: "Es imposible conocer simultáneamente la posición y el momento exactos de una partícula.",
      explicacion: "Cuanto más precisamente se determina la posición de una partícula, menos precisamente se puede conocer su momento, y viceversa."
    }
  }
];
