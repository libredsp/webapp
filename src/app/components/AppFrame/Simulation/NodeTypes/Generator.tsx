import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export class Generator extends NodeBase {
  constructor(id: string, x: number, y: number, value = 0, displayName = "Gen", width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.GENERATOR, width, height);
    this.value = value;
  }

  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  style = 'bg-teal-600';
}