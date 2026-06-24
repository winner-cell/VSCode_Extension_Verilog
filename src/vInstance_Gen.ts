import { ModuleInfo, formatParaDecl, formatPortMap, formatPortDecl, ljust } from './verilogParser';

export function generateInstance(info: ModuleInfo): string {
    const { name, paras, inputs, outputs, inouts } = info;
    const lines: string[] = [];

    if (paras.length > 0) {
        lines.push(`// ${name} Parameters`);
        lines.push(formatParaDecl(paras));
        lines.push('');
    }

    lines.push(`// ${name} Inputs`);
    lines.push(formatPortDecl(inputs, 'reg'));
    lines.push('');

    lines.push(`// ${name} Outputs`);
    lines.push(formatPortDecl(outputs, 'wire'));
    if (inouts.length > 0) {
        lines.push('');
        lines.push(`// ${name} Bidirs`);
        lines.push(formatPortDecl(inouts, 'wire'));
    }
    lines.push('');

    // instance parameter overrides use value
    let paraDef = '';
    if (paras.length > 0) {
        const l1 = Math.max(...paras.map(p => p.name.length));
        const l2 = Math.max(...paras.map(p => p.value.length));
        paraDef = '#(\n' + paras.map(p =>
            `    .${ljust(p.name, l1 + 1)}( ${ljust(p.value, l2)} )`
        ).join(',\n') + ')\n';
    }

    const portMap = formatPortMap([inputs, outputs, inouts], false);
    lines.push(`${name} ${paraDef}u_${name} (\n${portMap}\n);`);

    return lines.join('\n');
}
