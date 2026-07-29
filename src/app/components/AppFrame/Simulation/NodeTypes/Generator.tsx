import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export type GeneratorType =
    | { type: 'sine'; n: number; amplitude: number; frequency: number; phase: number }
    | { type: 'pulse'; n: number; amplitude: number; frequency: number; duty_cycle: number }
    | { type: 'noise'; n: number; standard_deviation: number; mean: number }
    | { type: 'delta'; n: number; position: number }
    | { type: 'step'; n: number; amplitude: number; step_index: number};

export class Generator extends NodeBase {
  constructor(
    id: string, x: number, y: number, value = 0, displayName = "Gen",
    width = 100, height = 50,
    generatorType: GeneratorType = { type: 'sine', n: 100, amplitude: 1, frequency: 1, phase: 0 }
  ) {
    super(id, displayName, x, y, BlockType.GENERATOR, width, height);
    this.value = value;
    this.generatorType = generatorType;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  generatorType: GeneratorType;
  style = 'bg-teal-600';
}