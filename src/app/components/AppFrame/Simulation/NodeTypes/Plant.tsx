
import { NodeBase, BlockType } from './index';

export class Plant extends NodeBase {
  constructor(
    id: string,
    x: number,
    y: number,
    num: number[],
    den: number[],
    samplingPeriod = 0.01,
    dt = 0.01,
    displayName = "Plant",
    simT = 0,
    simPrev = 0,
    simCurr = 0,
    width = 100,
    height = 50
  ) {
    super(id, displayName, x, y, BlockType.PLANT, width, height);
    this.num = num;
    this.den = den;
    this.simT = simT;
    this.simPrev = simPrev;
    this.simCurr = simCurr;
    this.dt = dt;
    this.samplingPeriod = samplingPeriod;

    this.stepsPerSample = Math.round(samplingPeriod / dt);
  }

  setTs(Ts: number) {
    this.stepsPerSample = Math.round(Ts / this.dt);
  }


  setNum(num: number[]) {
    this.num = num;
  }

  setDen(den: number[]) {
    this.den = den;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  style = 'bg-teal-600';
  num: number[];
  den: number[];

  simT: number;

  A: number[][] | undefined;
  B: number[][] | undefined;
  C: number[][] | undefined;
  D: number | undefined;
  simPrev: number;
  simCurr: number;


  x0: number[];
  dt: number;
  numOfSteps: number;
  samplingPeriod: number;

  X: number[];

  states: number[][];
  outputs: number[] = [];
  times: number[] = [];
  t = 0;
  sampledOutput = [];
  sampledTimes = [];
  stepsPerSample: number;
}

