"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestbench = void 0;
const verilogParser_1 = require("./verilogParser");
function generateTestbench(info) {
    const { name, paras, inputs, outputs, inouts } = info;
    const lines = [];
    lines.push('//~ `New testbench');
    lines.push('`timescale  1ns / 1ps');
    lines.push('');
    lines.push(`module tb_${name};`);
    lines.push('');
    // parameters (with PERIOD prepended)
    const allParas = [
        { name: 'PERIOD', value: '10' },
        ...paras,
    ];
    lines.push(`// ${name} Parameters`);
    lines.push((0, verilogParser_1.formatParaDecl)(allParas));
    lines.push('');
    // ports
    lines.push(`// ${name} Inputs`);
    lines.push((0, verilogParser_1.formatPortDecl)(inputs, 'reg', '0'));
    lines.push('');
    lines.push(`// ${name} Outputs`);
    lines.push((0, verilogParser_1.formatPortDecl)(outputs, 'wire'));
    if (inouts.length > 0) {
        lines.push('');
        lines.push(`// ${name} Bidirs`);
        lines.push((0, verilogParser_1.formatPortDecl)(inouts, 'wire'));
    }
    lines.push('');
    // clock & reset
    lines.push(`initial
begin
    forever #(PERIOD/2)  clk=~clk;
end`);
    lines.push(`initial
begin
    #(PERIOD*2) rst_n  =  1;
end`);
    lines.push('');
    // instance parameter overrides use name
    let paraDef = '';
    if (paras.length > 0) {
        const l1 = Math.max(...paras.map(p => p.name.length));
        paraDef = '#(\n' + paras.map(p => `    .${(0, verilogParser_1.ljust)(p.name, l1 + 1)}( ${(0, verilogParser_1.ljust)(p.name, l1)} )`).join(',\n') + ')\n';
    }
    const portMap = (0, verilogParser_1.formatPortMap)([inputs, outputs, inouts], true);
    lines.push(`${name} ${paraDef}u_${name} (\n${portMap}\n);`);
    lines.push('');
    lines.push(`initial
begin

    $finish;
end`);
    lines.push('');
    lines.push('endmodule');
    return lines.join('\n');
}
exports.generateTestbench = generateTestbench;
