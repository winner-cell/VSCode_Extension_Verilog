import { ModuleInfo, formatParaDecl, formatPortMap, formatPortDecl, ljust } from './verilogParser';

export function generateTestbench(info: ModuleInfo): string {
    const { name, paras, inputs, outputs, inouts } = info;
    const lines: string[] = [];

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
    lines.push(formatParaDecl(allParas));
    lines.push('');

    // ports
    lines.push(`// ${name} Inputs`);
    lines.push(formatPortDecl(inputs, 'reg', '0'));
    lines.push('');

    lines.push(`// ${name} Outputs`);
    lines.push(formatPortDecl(outputs, 'wire'));
    if (inouts.length > 0) {
        lines.push('');
        lines.push(`// ${name} Bidirs`);
        lines.push(formatPortDecl(inouts, 'wire'));
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
        paraDef = '#(\n' + paras.map(p =>
            `    .${ljust(p.name, l1 + 1)}( ${ljust(p.name, l1)} )`
        ).join(',\n') + ')\n';
    }

    const portMap = formatPortMap([inputs, outputs, inouts], true);
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
