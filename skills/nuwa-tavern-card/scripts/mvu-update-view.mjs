export function describePatch(patch) {
  if (!Array.isArray(patch)) throw new Error('Expected operations');
  const label = path => {
    if (typeof path !== 'string' || !path.startsWith('/')) throw new Error('Invalid path');
    const parts = path.slice(1).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    if (parts[0] === '关系' && parts.length > 2) parts.shift();
    return parts.join(' · ');
  };
  const value = input => {
    if (input === true) return '是';
    if (input === false) return '否';
    if (input === null) return '空';
    if (typeof input === 'object') return JSON.stringify(input);
    return String(input);
  };
  return patch.map(operation => {
    if (!operation || typeof operation !== 'object') throw new Error('Invalid operation');
    const name = label(operation.path ?? operation.to);
    switch (operation.op) {
      case 'delta':
        if (typeof operation.value !== 'number' || !Number.isFinite(operation.value)) throw new Error('Invalid delta');
        return { name, change: (operation.value > 0 ? '+' : '') + operation.value, tone: operation.value > 0 ? 'up' : operation.value < 0 ? 'down' : 'neutral' };
      case 'replace': return { name, change: '→ ' + value(operation.value), tone: 'neutral' };
      case 'insert': case 'add': return { name, change: '新增 ' + value(operation.value), tone: 'up' };
      case 'remove': return { name, change: '已移除', tone: 'down' };
      case 'move': return { name, change: '移自 ' + label(operation.from), tone: 'neutral' };
      default: throw new Error('Unsupported operation');
    }
  });
}

export function renderChanges(document) {
  const target = document.getElementById('changes');
  const summary = document.getElementById('title');
  try {
    const patch = JSON.parse(document.getElementById('payload').value);
    const rows = describePatch(patch);
    summary.textContent = rows.length ? '本轮变化 · ' + rows.length + ' 项' : '本轮无变量变化';
    target.replaceChildren();
    for (const row of rows) {
      const item = document.createElement('div');
      item.className = 'change';
      const name = document.createElement('span');
      name.textContent = row.name;
      const change = document.createElement('strong');
      change.className = row.tone;
      change.textContent = row.change;
      item.append(name, change);
      target.append(item);
    }
  } catch {
    summary.textContent = '变量记录已收到';
    target.textContent = '这条记录暂时无法显示为变化条目。可在 MVU 变量面板核对结果。';
  }
}
