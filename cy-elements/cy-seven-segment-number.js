import './cy-layout-row.js';
import CySevenSegment from './cy-seven-segment.js';
"use strict";
/**
 * Clase que define un display de dígitos en siete segmentos.
 */
class CySevenSegmentNumber extends CySevenSegment {
    /**
     * Instancia el componente y sus dependencias, e inicializa el estado.
     */
    constructor() {
        super();
        if (!customElements.get('cy-seven-segment')) {
            customElements.define('cy-seven-segment', CySevenSegment);
        }
        this.allDigits = [];
        this.clearDisplay();
    }
    createTemplate() {
        let sevenSegment = '<fg-layout-row id="led-row">';
        if (this.cfg.options.withSign) {
            sevenSegment += '<fg-seven-segment-digit id="digitSign"></fg-seven-segment-digit>';
        }
        for (let i = 0; i < this.cfg.options.nints; i++) {
            sevenSegment += `<fg-seven-segment-digit id="digitInt${i}"></fg-seven-segment-digit>`;
        }
        for (let i = 0; i < this.cfg.options.ndecs; i++) {
            sevenSegment += `<fg-seven-segment-digit id="digitDec${i}"></fg-seven-segment-digit>`;
        }
        sevenSegment += '</fg-layout-row>';
        return sevenSegment;
    }
    changeDisplay() {
        let value = this.value;
        this.clearDisplay();
        let isLogicalOverflow = this.isLogicalOverflow(value);
        if (value.startsWith('-')) {
            this.allDigits[0].setDynamicData('-', isLogicalOverflow);
            value = value.substring(1);
        }
        let floatNumber = value.split('.');
        let numIntsDisplay = this.cfg.options.nints;
        let numDecimalsDisplay = this.cfg.options.ndecs;
        let isPhysicalOverflow = this.isPhysicalOverflow(numIntsDisplay, numDecimalsDisplay, floatNumber);
        if (isPhysicalOverflow) {
            this.setValueToAllDigits(this.cfg.options.physicalOverflowChar);
        }
        else {
            let signPosition = 0;
            if (this.cfg.options.withSign) {
                signPosition = 1;
            }
            let intNumber = value.replace('.', '');
            let numIntNumber = intNumber.length;
            let numberIntPart = floatNumber[0];
            let numIntsNumber = numberIntPart.length;
            let numberInitPosition = numIntsDisplay - numIntsNumber + signPosition;
            let numberEndPosition = numberInitPosition + numIntNumber;
            for (let i = numberInitPosition, j = 0; i < numberEndPosition; i++, j++) {
                this.allDigits[i].setDynamicData(intNumber.charAt(j), isLogicalOverflow);
            }
            if (this.cfg.options.ndecs != 0) {
                let lastIntDigitPosition = numIntsDisplay - 1 + signPosition;
                this.allDigits[lastIntDigitPosition].setDynamicData(this.allDigits[lastIntDigitPosition].value + ".", isLogicalOverflow); // Se reescribe el último dígito entero con el punto.
            }
        }
    }
    /**
     * Inicialización y definición de los parámetros configurables del componente.
     * @returns Configuración incial del componente
     */
    getStyling() {
        return new Styling(JSON.stringify({
            withSign: true,
            nints: 5,
            ndecs: 4,
            physicalOverflowChar: '_',
            maxThresholdValue: 89999,
            minThresholdValue: -89999
        }));
    }
    /**
     * Asigna value al display
     * @param Valor del display
     */
    setDynamicData(value) {
        this.value = String(value);
        this.changeDisplay();
    }
    /**
     * Crea referencias a objetos de la plantilla.
     */
    createTemplateReferences() {
        this.allDigits = Array.from(this.dom.querySelectorAll('fg-seven-segment-digit')); // Referencia a cada dígito
    }
    /**
     * Borra el valor del display.
     */
    clearDisplay() {
        this.allDigits.forEach((el) => {
            el.clearDisplay();
            el.value = "";
        });
    }
    /**
     * Dada la configuración de un display, indica si se ha producido un overflow físico.
     * @param numIntsDisplay Número de dígitos enteros en el display
     * @param numDecimalsDisplay Número de dígitos decimales en el display
     * @param floatNumber Número real a validar
     * @returns true si se ha producido un overflow físico y false en caso contrario
     */
    isPhysicalOverflow(numIntsDisplay, numDecimalsDisplay, floatNumber) {
        let numberIntPart = floatNumber[0];
        let numberDecimalPart = floatNumber[1];
        let numIntsNumber = numberIntPart.length;
        let numDecimalsNumber = 0;
        if (floatNumber.length === 2) {
            numDecimalsNumber = numberDecimalPart.length;
        }
        return (numIntsDisplay < numIntsNumber || numDecimalsDisplay < numDecimalsNumber);
    }
    /**
     * Indica si se ha producido un overflow lógico.
     * @param value Valor a validar
     * @returns true si se ha producido un overflow lógico y false en caso contrario
     */
    isLogicalOverflow(value) {
        return (!isNaN(value) && (value < this.cfg.options.minThresholdValue || value > this.cfg.options.maxThresholdValue));
    }
    /**
     * Asigna el caracter newVal a todos los dígitos del display
     * @param newVal Valor a asignar a cada dígito
     */
    setValueToAllDigits(newVal) {
        this.allDigits.forEach((el) => {
            el.value = newVal;
            el.setDynamicData(el.value);
        });
    }
}
customElements.define('cy-seven-segment-number', CySevenSegmentNumber);
