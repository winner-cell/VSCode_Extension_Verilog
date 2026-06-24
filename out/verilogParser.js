"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestbench = exports.generateInstance = void 0;
const fs = require("fs");
const iconv = require("iconv-lite");
// ── file reading ──────────────────────────────────────────────
function readVerilogFile(filePath) {
    const buf = fs.readFileSync(filePath);
    for (const enc of ['utf-8', 'gbk', 'latin1']) {
        try {
            if (enc === 'gbk') {
                return iconv.decode(buf, 'gbk');
            }
            return buf.toString(enc);
        }
        catch (_a) {
            continue;
        }
    }
    throw new Error(`Failed to read ${filePath} with any supported encoding`);
}
// ── comment / block removal ───────────────────────────────────
function delComment(text) {
    return text
        .replace(/\/\*(.*?)\*\//gs, '\n')
        .replace(/\/\/.*$/gm, '\n');
}
function delBlock(text) {
    return text
        .replace(/\Wtask\W[\W\w]*?\Wendtask\W/g, '\n')
        .replace(/\Wfunction\W[\W\w]*?\Wendfunction\W/g, '\n');
}
// ── module parsing ────────────────────────────────────────────
function findName(text) {
    const m = /([a-zA-Z_][a-zA-Z_0-9]*)\s*/.exec(text);
    if (!m) {
        throw new Error('Cannot find module name');
    }
    return m[1];
}
function paraDeclare(text) {
    const re = new RegExp('\\sparameter\\s[\\w\\W]*?[;,)]', 'g');
    return text.match(re) || [];
}
function portDeclare(text, portDir) {
    const re = new RegExp('\\b' + portDir +
        '(\\s+(?:wire|reg)\\s+)*' +
        '(\\s*signed\\s+)*' +
        '(\\s*\\[.*?:.*?\\]\\s*)*' +
        '(?<port_list>.*?)' +
        '(?=\\binput\\b|\\boutput\\b|\\binout\\b|;|\\))', 'gs');
    const result = [];
    for (const m of text.matchAll(re)) {
        const range = (m[3] || '').trim();
        const portList = m.groups.port_list;
        const ports = portList.split(',').map(s => s.trim()).filter(s => s !== '');
        for (const p of ports) {
            const name = p.replace(/\s*=.*/s, '').trim();
            result.push({ name, range });
        }
    }
    return result;
}
// ── formatting helpers ────────────────────────────────────────
function ljust(s, n) {
    return s.length >= n ? s : s + ' '.repeat(n - s.length);
}
function parseParaKVs(paraLines) {
    const joined = paraLines.join('\n');
    const re = /([a-zA-Z_][a-zA-Z_0-9]*)\s*=\s*([\w\W]*?)\s*[;,)]/g;
    const result = [];
    for (const m of joined.matchAll(re)) {
        result.push({ name: m[1], value: m[2] });
    }
    return result;
}
function formatParaDecl(paras) {
    if (paras.length === 0) {
        return '';
    }
    const l1 = Math.max(...paras.map(p => p.name.length));
    const l2 = Math.max(...paras.map(p => p.value.length));
    return paras.map(p => `parameter ${ljust(p.name, l1 + 1)}= ${ljust(p.value, l2)};`).join('\n');
}
function formatPortMap(portGroups, withRange) {
    const all = portGroups.flat();
    if (all.length === 0) {
        return '';
    }
    const l1 = Math.max(...all.map(p => p.name.length)) + 2;
    const l3 = Math.max(24, l1);
    const blocks = [];
    for (const group of portGroups) {
        if (group.length === 0) {
            continue;
        }
        const lines = group.map(p => {
            const left = ljust(p.name, l3);
            let right = ljust(p.name, l1);
            if (withRange) {
                const l2 = Math.max(...all.map(x => x.range.length));
                right += ljust(p.range, l2);
            }
            return `    .${left}( ${right} )`;
        });
        blocks.push(lines.join(',\n'));
    }
    return blocks.join(',\n\n');
}
function formatPortDecl(ports, type, initial = '') {
    if (ports.length === 0) {
        return '';
    }
    return ports.map(p => {
        const init = initial ? ` = ${initial}` : '';
        const spacer = p.range ? '  ' : '';
        const decl = ljust(`${p.range}${spacer}${p.name}`, 36) + init;
        return `${ljust(type, 4)}  ${decl} ;`;
    }).join('\n');
}
// ── output generators ─────────────────────────────────────────
function generateInstance(filePath) {
    let text = readVerilogFile(filePath);
    text = delComment(text);
    text = delBlock(text);
    const moBegin = text.search(/(?:^|\b)module\b/);
    const moEnd = text.search(/\bendmodule\b/);
    text = text.slice(moBegin + 'module'.length, moEnd);
    const name = findName(text);
    const paras = parseParaKVs(paraDeclare(text));
    const inputs = portDeclare(text, 'input');
    const outputs = portDeclare(text, 'output');
    const inouts = portDeclare(text, 'inout');
    const lines = [];
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
        paraDef = '#(\n' + paras.map(p => `    .${ljust(p.name, l1 + 1)}( ${ljust(p.value, l2)} )`).join(',\n') + ')\n';
    }
    const portMap = formatPortMap([inputs, outputs, inouts], false);
    lines.push(`${name} ${paraDef}u_${name} (\n${portMap}\n);`);
    return lines.join('\n');
}
exports.generateInstance = generateInstance;
function generateTestbench(filePath) {
    let text = readVerilogFile(filePath);
    text = delComment(text);
    text = delBlock(text);
    const moBegin = text.search(/(?:^|\b)module\b/);
    const moEnd = text.search(/\bendmodule\b/);
    text = text.slice(moBegin + 'module'.length, moEnd);
    const name = findName(text);
    const paras = parseParaKVs(paraDeclare(text));
    const inputs = portDeclare(text, 'input');
    const outputs = portDeclare(text, 'output');
    const inouts = portDeclare(text, 'inout');
    const lines = [];
    lines.push('//~ `New testbench');
    lines.push('`timescale  1ns / 1ps');
    lines.push('');
    lines.push(`module tb_${name};`);
    lines.push('');
    // parameters
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
        paraDef = '#(\n' + paras.map(p => `    .${ljust(p.name, l1 + 1)}( ${ljust(p.name, l1)} )`).join(',\n') + ')\n';
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
exports.generateTestbench = generateTestbench;
//# sourceMappingURL=verilogParser.js.map