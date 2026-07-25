import { WindowType, FilterType, AnalogToDigitalTransformationDesignMethod } from './app/components/core/enums';
import { TransferFunction } from '@libredsp/core';

export const chosenWindowTypeToCode = (windowType: WindowType) => {
    switch(windowType) {
        case WindowType.RECTANGULAR:
            return 0;
        case WindowType.HAN:
            return 1;
        case WindowType.HAMMING:
            return 2;
        case WindowType.BARTLETT:
            return 3;
    }
}

export const chosenFilterTypeToCode = (filterType: FilterType) => {
    switch(filterType) {
        case FilterType.LOWPASS:
            return 0;
        case FilterType.HIGHPASS:
            return 1;
        case FilterType.BANDPASS:
            return 2;
        case FilterType.BANDSTOP:
            return 3;        
    }
}

export const wasmTfToJsTf = (tf: TransferFunction) => {
    return {
        num: Array.from(tf.num),
        den: Array.from(tf.den),
    };
}

export const chosenDesignMethodToCode = (method: AnalogToDigitalTransformationDesignMethod) => {
    switch(method) {
        case AnalogToDigitalTransformationDesignMethod.BUTTERWORTH:
            return 0;
        case AnalogToDigitalTransformationDesignMethod.CHEBYSHEV:
            return 1;
    }
}
