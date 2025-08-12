// huffman-calc.js
// Lógica de Huffman, cálculos, estadísticas y exportación de análisis

export function buildHuffmanTree(symbols) {
  const nodes = symbols.map(s => ({ ...s, left: null, right: null, id: Math.random() }));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.prob - b.prob);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push({
      symbol: null,
      prob: left.prob + right.prob,
      left,
      right,
      id: Math.random()
    });
  }
  return nodes[0];
}

export function buildCode(node, code = '', map = {}) {
  if (node.symbol !== null) {
    map[node.symbol] = code || '0';
  } else {
    if (node.left) buildCode(node.left, code + '0', map);
    if (node.right) buildCode(node.right, code + '1', map);
  }
  return map;
}

export function getMaxDepth(node, depth = 0) {
  if (!node) return depth;
  if (node.symbol !== null) return depth;
  return Math.max(
    getMaxDepth(node.left, depth + 1),
    getMaxDepth(node.right, depth + 1)
  );
}

export function countLeavesInTree(node) {
  if (!node) return 0;
  if (node.symbol !== null) return 1;
  return countLeavesInTree(node.left) + countLeavesInTree(node.right);
}

export function displayResults(symbols, entropy, avgLength, efficiency, channelEfficiency) {
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';
  resultsSection.classList.add('fade-in');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  displayOverview(symbols, entropy, avgLength, efficiency, channelEfficiency);
  displayTable(symbols);
}

export function displayOverview(symbols, entropy, avgLength, efficiency, channelEfficiency) {
  const n = symbols.length;
  const hmax = Math.log2(n);
  const redundancy = hmax > 0 ? (hmax - entropy) / hmax : 0;
  const statsHTML = `
    <div class="stat-card">
      <div class="stat-value">${entropy.toFixed(3)}</div>
      <div class="stat-label">Entropía (bits)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${hmax.toFixed(3)}</div>
      <div class="stat-label">Entropía Máxima (bits)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${avgLength.toFixed(3)}</div>
      <div class="stat-label">Longitud Media</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(redundancy * 100).toFixed(2)}%</div>
      <div class="stat-label">Redundancia</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(efficiency * 100).toFixed(2)}%</div>
      <div class="stat-label">Eficiencia Código</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(channelEfficiency * 100).toFixed(2)}%</div>
      <div class="stat-label">Eficiencia Canal</div>
    </div>
   
  `;
  document.getElementById('statistics-container').innerHTML = statsHTML;
  const codesHTML = symbols.map(s => `
    <div class="code-item">
      <span class="code-symbol">${s.symbol}</span>
      <span class="code-value">${s.code}</span>
    </div>
  `).join('');
  document.getElementById('codes-list').innerHTML = codesHTML;
}

export function displayTable(symbols) {
  // Ordenar por probabilidad descendente (mayor a menor)
  const sorted = [...symbols].sort((a, b) => b.prob - a.prob);
  const tableRows = sorted.map(s => `
    <tr class="fade-in">
      <td><strong>${s.symbol}</strong></td>
      <td>${s.prob.toFixed(3)} (${(s.prob * 100).toFixed(2)}%)</td>
      <td>${s.info.toFixed(3)}</td>
      <td><code>${s.code}</code></td>
      <td>${s.length}</td>
    </tr>
  `).join('');
  const tableHTML = `
    <div style="margin:8px;text-align:right;font-size:0.95em;color:#64748b;">
      <span>Ordenado por probabilidad (mayor a menor)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Símbolo</th>
          <th>Probabilidad</th>
          <th>Información (bits)</th>
          <th>Código Huffman</th>
          <th>Longitud</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
  document.getElementById('results-table').innerHTML = tableHTML;
}

export function exportCompleteAnalysis(currentSymbols, currentCodes, currentTree) {
  const now = new Date();
  const timestamp = now.toLocaleString('es-ES');
  let content = '';
  content += '═══════════════════════════════════════════════════════════════\n';
  content += '                ANÁLISIS COMPLETO DE CODIFICACIÓN HUFFMAN\n';
  content += '═══════════════════════════════════════════════════════════════\n';
  content += `Generado: ${timestamp}\n`;
  content += `Algoritmo: Huffman - Teoría de la Información\n`;
  content += '═══════════════════════════════════════════════════════════════\n\n';
  content += '📊 DATOS DE ENTRADA:\n';
  content += '─────────────────────\n';
  currentSymbols.forEach(symbol => {
    content += `${symbol.symbol}: ${symbol.prob.toFixed(4)}\n`;
  });
  content += '\n';
  content += '🔢 CÓDIGOS HUFFMAN GENERADOS:\n';
  content += '───────────────────────────────\n';
  content += 'Símbolo | Probabilidad | Información | Código    | Longitud\n';
  content += '───────┼──────────────┼─────────────┼───────────┼─────────\n';
  currentSymbols.forEach(symbol => {
    const code = currentCodes[symbol.symbol] || 'N/A';
    const info = symbol.prob > 0 ? (-Math.log2(symbol.prob)).toFixed(3) : 'N/A';
    const length = code !== 'N/A' ? code.length.toString() : 'N/A';
    const probStr = symbol.prob.toFixed(4);
    content += `   ${symbol.symbol.padEnd(4)} │ ${probStr.padStart(12)} │ ${info.padStart(11)} │ ${code.padEnd(9)} │ ${length.padStart(8)}\n`;
  });
  content += '\n';
  const stats = calculateDetailedStatistics(currentSymbols, currentCodes);
  content += '📈 ESTADÍSTICAS DE EFICIENCIA:\n';
  content += '────────────────────────────────\n';
  content += `Entropía (H):                    ${stats.entropy.toFixed(4)} bits\n`;
  content += `Longitud promedio (L):           ${stats.avgLength.toFixed(4)} bits\n`;
  content += `Eficiencia de codificación:      ${stats.efficiency.toFixed(2)}%\n`;
  content += `Redundancia:                     ${stats.redundancy.toFixed(4)} bits\n`;
  content += `Factor de compresión:            ${stats.compressionRatio.toFixed(2)}x\n`;
  content += `Bits ahorrados vs ASCII:         ${stats.bitsSaved} bits\n`;
  content += '\n';
  content += '🌳 ESTRUCTURA DEL ÁRBOL HUFFMAN:\n';
  content += '─────────────────────────────────\n';
  content += generateTreeText(currentTree);
  content += '\n';
  content += '🛤️ RUTAS DE CODIFICACIÓN:\n';
  content += '──────────────────────────\n';
  currentSymbols.forEach(symbol => {
    const path = findCodePath(currentTree, symbol.symbol);
    content += `${symbol.symbol}: ${path}\n`;
  });
  content += '\n';
  content += '💡 INFORMACIÓN TÉCNICA:\n';
  content += '─────────────────────────\n';
  content += `Total de símbolos:               ${currentSymbols.length}\n`;
  content += `Profundidad máxima del árbol:    ${calculateMaxDepth(currentTree)}\n`;
  content += `Número de nodos internos:        ${countInternalNodes(currentTree)}\n`;
  content += `Número total de nodos:           ${countTotalNodes(currentTree)}\n`;
  content += '\n';
  content += '═══════════════════════════════════════════════════════════════\n';
  content += 'Análisis generado con el Visualizador de Huffman de Facundo Sichi\n';
  content += '═══════════════════════════════════════════════════════════════\n';
  const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `huffman_analysis_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function calculateDetailedStatistics(currentSymbols, currentCodes) {
  let entropy = 0;
  let avgLength = 0;
  let totalBitsASCII = 0;
  let totalBitsHuffman = 0;
  currentSymbols.forEach(symbol => {
    const p = symbol.prob;
    if (p > 0) {
      entropy += -p * Math.log2(p);
      const codeLength = currentCodes[symbol.symbol]?.length || 0;
      avgLength += p * codeLength;
      totalBitsASCII += p * 8;
      totalBitsHuffman += p * codeLength;
    }
  });
  const efficiency = (entropy / avgLength) * 100;
  const redundancy = avgLength - entropy;
  const compressionRatio = totalBitsASCII / totalBitsHuffman;
  const bitsSaved = Math.round((totalBitsASCII - totalBitsHuffman) * 1000);
  return {
    entropy,
    avgLength,
    efficiency,
    redundancy,
    compressionRatio,
    bitsSaved
  };
}

function generateTreeText(node, prefix = '', isLast = true, depth = 0) {
  if (!node) return '';
  let result = '';
  const connector = isLast ? '└── ' : '├── ';
  const nodeInfo = node.symbol !== null ? 
    `${node.symbol} (${node.prob.toFixed(3)})` : 
    `${node.prob.toFixed(3)}`;
  result += prefix + connector + nodeInfo + '\n';
  const newPrefix = prefix + (isLast ? '    ' : '│   ');
  if (node.left || node.right) {
    if (node.left) {
      result += generateTreeText(node.left, newPrefix, !node.right, depth + 1);
    }
    if (node.right) {
      result += generateTreeText(node.right, newPrefix, true, depth + 1);
    }
  }
  return result;
}

function findCodePath(node, symbol, path = '') {
  if (!node) return null;
  if (node.symbol === symbol) {
    return path || 'raíz';
  }
  const leftPath = findCodePath(node.left, symbol, path + '0 (izq) → ');
  if (leftPath) return leftPath;
  const rightPath = findCodePath(node.right, symbol, path + '1 (der) → ');
  if (rightPath) return rightPath;
  return null;
}

function calculateMaxDepth(node, depth = 0) {
  if (!node) return depth;
  if (node.symbol !== null) return depth;
  return Math.max(
    calculateMaxDepth(node.left, depth + 1),
    calculateMaxDepth(node.right, depth + 1)
  );
}

function countInternalNodes(node) {
  if (!node || node.symbol !== null) return 0;
  return 1 + countInternalNodes(node.left) + countInternalNodes(node.right);
}

function countTotalNodes(node) {
  if (!node) return 0;
  return 1 + countTotalNodes(node.left) + countTotalNodes(node.right);
}
