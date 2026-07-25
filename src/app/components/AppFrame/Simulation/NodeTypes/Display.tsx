import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export class Display extends NodeBase {
  constructor(id: string, x: number, y: number, graphX = [], graphY = [], displayName = "🖥️", width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.DISPLAY, width, height);
    this.graphX = graphX;
    this.graphY = graphY;
  }

  execute(u: Signal[]): Signal {
    if (u && u.length > 0) {
      u.forEach(sig => {
        if (sig.y != null && sig.t != null) {
          this.graphX.push(Math.round(sig.t * 100) / 100);
          this.graphY.push(sig.y);
        }
      });
    }

    return { y: 0, t: 0, src: this };
  }

  init() {
    this.graphX.length = 0;
    this.graphY.length = 0;
  }

  static defaultWidth = 100;
  static defaultHeight = 50;
  graphX: number[];
  graphY: number[];
  style = 'bg-teal-600';
}