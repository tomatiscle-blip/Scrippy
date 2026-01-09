
export interface ProcessingResult {
  text: string;
  timestamp: number;
  type: 'summary' | 'analysis' | 'translation' | 'custom' | 'code' | 'json';
}

export enum ReaderAction {
  GENERATE_PYTHON = 'Generar Script de Cálculo',
  ARMADO_DETALLADO = 'Diseñar Armadura y Estribos',
  DIBUJAR_ARMADO = 'Visualizar Esquema de Barras (DIBUJO)',
  VERIFICAR_TORSION = 'Verificación de Torsión',
  PLANILLA_DOBLADO = 'Generar Planilla de Hierros',
  CUSTOM = 'Consulta Personalizada'
}

export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  action: ReaderAction;
  date: string;
}

export interface BarDrawing {
  id: string;
  type: 'longitudinal' | 'stirrup';
  points: { x: number, y: number }[];
  label: string;
  color: string;
}

export interface BeamSchema {
  length: number;
  height: number;
  width: number;
  bars: BarDrawing[];
}
