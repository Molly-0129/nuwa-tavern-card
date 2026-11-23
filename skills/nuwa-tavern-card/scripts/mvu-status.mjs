import { randomUUID } from 'node:crypto';

const updateBlock = /<(update(?:variable)?)>(?:(?!<\/?update(?:variable)?\s*>)[\s\S])*?<\/\1\s*>/gi;
const partialUpdate = /<update(?:variable)?>(?:(?!<\/?update(?:variable)?\s*>)[\s\S])*(?![\s\S])/gi;
const hiddenUpdate = new RegExp(updateBlock.source + '|' + partialUpdate.source, 'gi');
const statusMarker = /<StatusPlaceHolderImpl\s*\/>/g;

// Only JSON Patch is shown. Escape model text before moving it into HTML.
const patchBoundary = String.raw`<\/?(?:JSONPatch|UpdateVariable|Update)\s*>`;
const beforePatch = String.raw`(?<=<JSONPatch>(?:(?!` + patchBoundary + String.raw`)[\s\S])*)`;
const afterPatch = String.raw`(?=(?:(?!` + patchBoundary + String.raw`)[\s\S])*<\/JSONPatch\s*>)`;
const patchEscapes = [
  ['实体', /&/, '&amp;'],
  ['左尖括号', /<(?!\/JSONPatch\s*>)/, '&lt;'],
  ['右尖括号', />/, '&gt;'],
  ['宏起始符', /\{/, '&#123;'],
  ['换行', /\r\n?|\n/, '&#10;'],
];
const readyPatch = /<(update(?:variable)?)>(?:(?!<\/?update(?:variable)?\s*>)[\s\S])*?<JSONPatch>((?:[^<>&{\r\n]|&(?:amp|lt|gt|#123|#10);)*)<\/JSONPatch\s*>(?:(?!<\/?update(?:variable)?\s*>)[\s\S])*?<\/\1\s*>/gi;
const box = 'margin:.6em 0;padding:.6em .85em;border:1px solid #59796b;border-radius:10px;background:#152420;color:#ecf3ee';
const summary = 'cursor:pointer;color:#e2c683';
const code = 'margin:.55em 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.88em';

function rule(scriptName, pattern, replaceString, scope) {
  return {
    id: randomUUID(),
    scriptName,
    findRegex: pattern.toString(),
    replaceString,
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: scope === 'display',
    promptOnly: scope === 'prompt',
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null,
  };
}

export function buildMvuRegex({ panel = '', showProgress = true, decorateUpdates = true } = {}) {
  const scripts = [rule('[不发送]去除变量更新', updateBlock, '', 'prompt')];

  if (decorateUpdates) {
    for (const [label, target, replacement] of patchEscapes) {
      const pattern = new RegExp(beforePatch + '(?:' + target.source + ')' + afterPatch, 'gi');
      scripts.push(rule('[显示]变量更新转义 · ' + label, pattern, replacement, 'display'));
    }
    scripts.push(
      rule('[显示]美化 JSON Patch 更新', readyPatch,
        '\n\n<details style="' + box + '"><summary style="' + summary +
        '">变量更新详情</summary><pre style="' + code + '"><code>$2</code></pre></details>\n\n', 'display'),
      rule('[显示]完整变量更新提示', updateBlock,
        '\n\n<div style="' + box + '">变量已更新</div>\n\n', 'display'),
    );
  } else {
    scripts.push(rule('[显示]隐藏变量更新', hiddenUpdate, '', 'display'));
  }

  if (decorateUpdates) {
    scripts.push(rule('[显示]变量更新中', partialUpdate,
      showProgress ? '\n\n<div style="' + box + '">正在更新变量…</div>\n\n' : '', 'display'));
  }
  if (panel.trim()) {
    scripts.push(
      rule('[不发送]去除状态栏占位符', statusMarker, '', 'prompt'),
      rule('[界面]变量状态栏', statusMarker, panel, 'display'),
    );
  }
  return scripts;
}
