import React, { useEffect, useState } from 'react'
import { Plot } from '../Common/Plot'
import FFT from 'fft.js';
import { Panel } from './Panel';
import { WindowType, FilterType } from '../../core/enums';
import { FilterTest } from '../Common/FilterTest';
import { Equation } from '../Common/Equation';
import { ZeroPad } from '../../core';
import { windowing_method_wasm } from '@libredsp/core';
import { chosenFilterTypeToCode, chosenWindowTypeToCode, wasmTfToJsTf } from '../../../../wasm-utils';

export const FIRFilterDesign = () => {
    const [trigger, setTrigger] = useState(false);

    const [filterSize, setFilterSize] = useState(10);
    const [filterCoefficients, setFilterCoefficients] = useState<{ num: any[]; den: any[] }>({ num: [1], den: [] });
    const [lowCutoff, setLowCutoff] = useState(0.5);
    const [highCutoff, setHighCutoff] = useState(0.9);
    const [chosenFilterType, setChosenFilterType] = useState(FilterType.LOWPASS);
    const [chosenWindowType, setChosenWindowType] = useState(WindowType.RECTANGULAR);

    const [magnitudeResponse, setMagnitudeResponse] = useState({
        xValues: Array.from({ length: 1024 }, (_, i) => i / 1024 * Math.PI),
        yValues: Array.from({ length: 1024 }, (_, i) => 0)
    });

    const run = () => {
        const N = 1024;
        let out = {
            xValues: Array.from({ length: N / 2 }, (_, i) => i / N * 2 * Math.PI),
            yValues: Array.from({ length: N / 2 }, (_, i) => 0)
        };

        const coef = wasmTfToJsTf(windowing_method_wasm(
            filterSize,
            chosenWindowTypeToCode(chosenWindowType),
            chosenFilterTypeToCode(chosenFilterType),
            lowCutoff,
            highCutoff
        ));

        setFilterCoefficients(coef);

        const fft = new FFT(N);
        const spectrum = fft.createComplexArray();
        fft.realTransform(spectrum, ZeroPad(coef.num as number[], N));

        // Compute magnitude of freq. response
        const magnitude = new Array(N);
        for (let i = 0; i < N / 2; i++) {
            magnitude[i] = Math.sqrt(Math.pow(spectrum[i * 2], 2) + Math.pow(spectrum[i * 2 + 1], 2));
        }
        out.yValues = magnitude;
        setMagnitudeResponse(() => out)
    }

    useEffect(() => {
        run();
    }, [trigger]);

    return (
        <div className="flex flex-1 items-stretch justify-center">
            <div className="flex flex-col">
                <Panel
                    trigger={trigger} updateTrigger={(e) => setTrigger(e)}
                    chosenFilterType={chosenFilterType} updateChoosenFilterType={(e) => setChosenFilterType(e)}
                    chosenWindowType={chosenWindowType} updateChosenWindowType={(e) => setChosenWindowType(e)}
                    filterSize={filterSize} updateFilterSize={(e) => setFilterSize(e)}
                    lowCutoff={lowCutoff} updateLowCutoff={(e) => setLowCutoff(e)}
                    highCutoff={highCutoff} updateHighCutoff={(e) => setHighCutoff(e)}
                />
                <FilterTest filterCoefficients={filterCoefficients} />
            </div>
            <Plot title="Magnitude" x_axis_label="w (rad)" y_axis_label="|H(jw)|" dataToPlot={magnitudeResponse} plotColor={"rgba(75, 192, 192, 1)"} />
            <Equation filterCoefficients={"[" + filterCoefficients.num.map((x) => String(x.toFixed(4))).join(" ") + "]"} />

        </div>

    )
}
