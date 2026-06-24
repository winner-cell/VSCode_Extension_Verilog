"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInstance = void 0;
const verilogParser_1 = require("./verilogParser");
function generateInstance(info) {
    const { name, paras, inputs, outputs, inouts } = info;
    const lines = [];
    if (paras.length > 0) {
        lines.push(`// ${name} Parameters`);
        lines.push((0, verilogParser_1.formatParaDecl)(paras));
        lines.push('');
    }
    lines.push(`// ${name} Inputs`);
    lines.push((0, verilogParser_1.formatPortDecl)(inputs, 'reg'));
    lines.push('');
    lines.push(`// ${name} Outputs`);
    lines.push((0, verilogParser_1.formatPortDecl)(outputs, 'wire'));
    if (inouts.length > 0) {
        lines.push('');
        lines.push(`// ${name} Bidirs`);
        lines.push((0, verilogParser_1.formatPortDecl)(inouts, 'wire'));
    }
    lines.push('');
    // instance parameter overrides use value
    let paraDef = '';
    if (paras.length > 0) {
        const l1 = Math.max(...paras.map(p => p.name.length));
        const l2 = Math.max(...paras.map(p => p.value.length));
        paraDef = '#(\n' + paras.map(p => `    .${(0, verilogParser_1.ljust)(p.name, l1 + 1)}( ${(0, verilogParser_1.ljust)(p.value, l2)} )`).join(',\n') + ')\n';
    }
    const portMap = (0, verilogParser_1.formatPortMap)([inputs, outputs, inouts], false);
    lines.push(`${name} ${paraDef}u_${name} (\n${portMap}\n);`);
    return lines.join('\n');
}
exports.generateInstance = generateInstance;
