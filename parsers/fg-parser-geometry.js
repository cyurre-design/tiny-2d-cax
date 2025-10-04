"use strict";

import FgParserDxfGeometry from "./fg-parser-dxf-geometry.js";
import FgParserIsoGeometry from "./fg-parser-iso-geometry.js";
import FgParserJsonGeometry from "./fg-parser-json-geometry.js";

export default class FgParserGeometry {
    static toGeometry(data, type, config) {
        let result;

        switch (type) {
            case "dxf":
                result = FgParserDxfGeometry.toGeometry(data);

                break;
            case "json":
                result = FgParserJsonGeometry.toGeometry(data);

                break;
            default:
                result = FgParserIsoGeometry.toGeometry(data, config);

                break;
        }

        return result;
    }
    static fromGeometry(processData,processGeoData, config) {
        
        let result = FgParserIsoGeometry.fromGeometry(processData, processGeoData, config);
        return result;
    }
}