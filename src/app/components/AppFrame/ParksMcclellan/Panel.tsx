import React, { useState } from 'react'
import Infobox from '../../ui/Infobox';
import { abs } from 'mathjs';

export const Panel = ({ trigger, updateTrigger,
    filterSize, updateFilterSize,
    frequencies, updateFrequencies,
    amplitudes, updateAmplitudes,
    weights, updateWeights,
    filterType, updateFilterType
}) => {
    const [freqText, setFreqText] = useState('0 0.1 0.4 3.14');
    const [amplitudesText, setAmplitudesText] = useState('1 1 0 0');
    const [weightText, setWeightText] = useState('1 1 1 1');

    const validateFreq = (freqArray) => {
        if (freqArray.length == 0) return false;
        // Check the frequencies are in ascending order and between 0 and Pi  
        for (let i = 0; i < freqArray.length; i++) {
            if (freqArray[i] < 0 || freqArray[i] > Math.PI) return false;
            if (freqArray[i] < freqArray[i - 1]) return false;
            if (abs(freqArray[i] - freqArray[i - 1]) < 0.0001) return false;
        }

        return true;
    }

    const validateAmplitudes = (freqArray) => {
        if (freqArray.length == 0) return false;
        for (let i = 0; i < freqArray.length; i++) {
            if (freqArray[i] < 0) return false;
        }

        return true;
    }

    return (
        <div className="bg-gray-50 p-4 my-5 mx-2 rounded-2xl shadow-md">
            <div className="flex p-2 justify-between">
                <div className="flex flex-col my-4 mx-3">
                    <label className="my-2 mb-2">Amplitudes:</label>
                    <label className="my-2 mb-2">Frequencies:</label>
                    <label className="my-2 mb-2">Weights:</label>
                    <label className="my-2 mb-2">Filter Size:</label>

                </div>

                <div className="flex flex-col m-4">
                    <div className="flex items-center">

                        <input
                            type="text"
                            className="rounded-lg shadow m-1 p-1 w-64"
                            value={amplitudesText}
                            onChange={(e) => setAmplitudesText(e.target.value)}
                            placeholder="Amplitudes (space separated)"
                        />

                    </div>
                    <div className="flex items-center">

                        <input
                            type="text"
                            className="rounded-lg shadow m-1 p-1 w-64"
                            value={freqText}
                            onChange={(e) => setFreqText(e.target.value)}
                            placeholder="Frequencies (space separated)"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="text"
                            className="rounded-lg shadow m-1 p-1 w-64"
                            value={weightText}
                            onChange={(e) => setWeightText(e.target.value)}
                            placeholder="Frequencies (space separated)"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between ">
                            <input
                                type="number"
                                min="2" max="1000"
                                step="1"
                                className="rounded-lg shadow p-1 my-1 w-32 mx-1"
                                value={filterSize}
                                onChange={(e) => {
                                    const isEvenType = (filterType === 2 || filterType === 4);
                                    const val = Number(e.target.value);
                                    const needsEven = isEvenType;
                                    const violatesParity = needsEven ? (val % 2 !== 0) : (val % 2 === 0);

                                    if (!violatesParity) {
                                        updateFilterSize(val);
                                        return;
                                    }

                                    // nudge in the direction the user was already moving
                                    const increasing = val > filterSize;
                                    updateFilterSize(increasing ? val + 1 : val - 1);
                                }}
                            />
                            <select
                                className="ml-3 rounded-lg shadow p-1 my-1 mx-1"
                                value={filterType}
                                onChange={(e) => {
                                    const newType = Number(e.target.value);
                                    updateFilterType(newType);
                                    const needsEven = (newType === 2 || newType === 4);
                                    if (needsEven && filterSize % 2 !== 0) updateFilterSize(filterSize + 1);
                                    if (!needsEven && filterSize % 2 === 0) updateFilterSize(filterSize + 1);
                                }}
                            >
                                <option value={1}>Type I</option>
                                <option value={2}>Type II</option>
                                <option value={3}>Type III</option>
                                <option value={4}>Type IV</option>
                            </select>
                        </div>

                    </div>
                </div>
                <Infobox text="Enter normalized frequency ranges and their corresponding amplitudes as pairs, along with their weights.
                               Ex: Freq = [0 0.2 0.8 1], Amp = [1 1 0 0], and Weight = [10 1] defines a lowpass filter with unity gain from 0-0.2 and zero elsewhere, with more weight given to the passband." />

            </div>
            <div className="text-center text-lg pb-4">
                <button
                    onClick={() => {
                        const freqArray = freqText
                            .split(' ')
                            .map(x => parseFloat(x.trim()))
                            .filter(x => !isNaN(x));

                        const amplitudesArray = amplitudesText
                            .split(' ')
                            .map(x => parseFloat(x.trim()))
                            .filter(x => !isNaN(x));

                        const weightsArray = weightText
                            .split(' ')
                            .map(x => parseFloat(x.trim()))
                            .filter(x => !isNaN(x));

                        if (
                            (validateFreq(freqArray) && validateAmplitudes(amplitudesArray)) &&
                            (freqArray.length == amplitudesArray.length) &&
                            (weightsArray.length == freqArray.length)) {
                            updateTrigger(!trigger);
                            updateFrequencies(freqArray);
                            updateAmplitudes(amplitudesArray);
                            updateWeights(weightsArray);
                        }
                    }}
                    className="h-10 my-3 text-sm mx-2 px-6 bg-indigo-600 rounded-lg text-white p-2 hover:bg-blue-800"
                >
                    Design Filter
                </button>
            </div>

        </div>

    )
}
