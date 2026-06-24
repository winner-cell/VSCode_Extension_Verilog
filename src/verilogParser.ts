import * as fs from 'fs';
import * as iconv from 'iconv-lite';

// ── file reading ──────────────────────────────────────────────

export function readVerilogFile(filePath: string): string {
    const buf = fs.readFileSync(filePath);
    for (const enc of ['utf-8', 'gbk', 'latin1']) {
        try {
            if (enc === 'gbk') {
                return iconv.decode(buf, 'gbk');
            }
            return buf.toString(enc as BufferEncoding);
        } catch {
            continue;
        }
    }
    throw new Error(`Failed to read ${filePath} with any supported encoding`);
}

// ── comment / block removal ───────────────────────────────────

function delComment(text: string): string {
    return text
        .replace(/\/\*(.*?)\*\//gs, '\n')
        .replace(/\/\/.*$/gm, '\n');
}

function delBlock(text: string): string {
    return text
        .replace(/\Wtask\W[\W\w]*?\Wendtask\W/g, '\n')
        .replace(/\Wfunction\W[\W\w]*?\Wendfunction\W/g, '\n');
}

// ── module parsing ────────────────────────────────────────────

export interface PortEntry {
    name: string;
    range: string;
}

export interface ParaKV {
    name: string;
    value: string;
}

export interface ModuleInfo {
    name: string;
    paras: ParaKV[];
    inputs: PortEntry[];
    outputs: PortEntry[];
    inouts: PortEntry[];
}

export function parseModule(filePath: string): ModuleInfo {
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

    return { name, paras, inputs, outputs, inouts };
}

function findName(text: string): string {
    const m = /([a-zA-Z_][a-zA-Z_0-9]*)\s*/.exec(text);
    if (!m) { throw new Error('Cannot find module name'); }
    return m[1];
}

function paraDeclare(text: string): string[] {
    const re = new RegExp('\\sparameter\\s[\\w\\W]*?[;,)]', 'g');
    return text.match(re) || [];
}

function parseParaKVs(paraLines: string[]): ParaKV[] {
    const joined = paraLines.join('\n');
    const re = /([a-zA-Z_][a-zA-Z_0-9]*)\s*=\s*([\w\W]*?)\s*[;,)]/g;
    const result: ParaKV[] = [];
    for (const m of joined.matchAll(re)) {
        result.push({ name: m[1], value: m[2] });
    }
    return result;
}

function portDeclare(text: string, portDir: string): PortEntry[] {
    const re = new RegExp(
        '\\b' + portDir +
        '(\\s+(?:wire|reg)\\s+)*' +
        '(\\s*signed\\s+)*' +
        '(\\s*\\[.*?:.*?\\]\\s*)*' +
        '(?<port_list>.*?)' +
        '(?=\\binput\\b|\\boutput\\b|\\binout\\b|;|\\))',
        'gs'
    );

    const result: PortEntry[] = [];
    for (const m of text.matchAll(re)) {
        const range = (m[3] || '').trim();
        const portList = m.groups!.port_list;
        const ports = portList.split(',').map(s => s.trim()).filter(s => s !== '');
        for (const p of ports) {
            const name = p.replace(/\s*=.*/s, '').trim();
            result.push({ name, range });
        }
    }
    return result;
}

// ── formatting helpers ────────────────────────────────────────

export function ljust(s: string, n: number): string {
    return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

export function formatParaDecl(paras: ParaKV[]): string {
    if (paras.length === 0) { return ''; }
    const l1 = Math.max(...paras.map(p => p.name.length));
    const l2 = Math.max(...paras.map(p => p.value.length));
    return paras.map(p =>
        `parameter ${ljust(p.name, l1 + 1)}= ${ljust(p.value, l2)};`
    ).join('\n');
}

export function formatPortMap(portGroups: PortEntry[][], withRange: boolean): string {
    const all = portGroups.flat();
    if (all.length === 0) { return ''; }

    const l1 = Math.max(...all.map(p => p.name.length)) + 2;
    const l3 = Math.max(24, l1);

    const blocks: string[] = [];
    for (const group of portGroups) {
        if (group.length === 0) { continue; }
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

export function formatPortDecl(ports: PortEntry[], type: string, initial: string = ''): string {
    if (ports.length === 0) { return ''; }
    return ports.map(p => {
        const init = initial ? ` = ${initial}` : '';
        const spacer = p.range ? '  ' : '';
        const decl = ljust(`${p.range}${spacer}${p.name}`, 36) + init;
        return `${ljust(type, 4)}  ${decl} ;`;
    }).join('\n');
}
