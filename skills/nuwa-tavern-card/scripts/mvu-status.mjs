import { randomUUID } from 'node:crypto';

const updateBlock = /<(update(?:variable)?)>(?:(?!<update(?:variable)?>)[\s\S])*?<\/\1\s*>/gi;
const partialUpdate = /<update(?:variable)?>(?:(?!<\/?update(?:variable)?\s*>)[\s\S])*(?![\s\S])/gi;
const statusMarker = /<StatusPlaceHolderImpl\s*\/>/g;

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

export function buildMvuRegex({ panel = '', showProgress = false } = {}) {
  const scripts = [
    rule('[不发送]去除变量更新', updateBlock, '', 'prompt'),
    rule('[显示]完整变量更新', updateBlock, '\n\n*变量更新记录已隐藏*\n\n', 'display'),
  ];
  if (showProgress) {
    scripts.push(rule('[显示]变量更新中', partialUpdate, '\n\n*正在更新变量…*\n\n', 'display'));
  }
  if (panel.trim()) {
    scripts.push(
      rule('[不发送]去除状态栏占位符', statusMarker, '', 'prompt'),
      rule('[界面]变量状态栏', statusMarker, panel, 'display'),
    );
  }
  return scripts;
}
