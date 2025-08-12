// tree-visual.js
// Visualización, animaciones y exportación SVG del árbol de Huffman
import { getMaxDepth, countLeavesInTree } from './huffman-calc.js';

export function drawSVGTree(tree) {
  const svg = document.getElementById('tree-svg');
  const container = svg.parentElement;
  const isMobile = window.innerWidth <= 768;
  let width;
  if (isMobile) {
    const treeDepth = getMaxDepth(tree);
    const leafCount = countLeavesInTree(tree);
    width = Math.max(1200, leafCount * 150, treeDepth * 200);
  } else {
    width = container.clientWidth - 40;
  }
  const height = 600;
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = '';
  if (isMobile) {
    svg.style.minWidth = `${width}px`;
    svg.style.width = `${width}px`;
  }
  if (!tree) return;
  const positions = calculateHorizontalNodePositions(tree, width, height);
  drawHorizontalConnections(svg, tree, positions);
  drawHorizontalNodes(svg, tree, positions);
  if (isMobile) {
    setTimeout(() => {
      const container = document.querySelector('.tree-container-responsive');
      if (container) {
        container.scrollLeft = 0;
        container.scrollTop = 0;
      }
    }, 50);
  }
}

function calculateHorizontalNodePositions(tree, width, height) {
  const positions = new Map();
  function getMaxDepthLocal(node, depth = 0) {
    if (!node) return depth;
    if (node.symbol !== null) return depth;
    return Math.max(
      getMaxDepthLocal(node.left, depth + 1),
      getMaxDepthLocal(node.right, depth + 1)
    );
  }
  function countLeavesLocal(node) {
    if (!node) return 0;
    if (node.symbol !== null) return 1;
    return countLeavesLocal(node.left) + countLeavesLocal(node.right);
  }
  const maxDepth = getMaxDepthLocal(tree);
  function countLeaves(node) {
    if (!node) return 0;
    if (node.symbol !== null) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
  }
  function assignPositions(node, depth = 0, minY = 0, maxY = height) {
    if (!node) return;
    const x = 80 + (depth * (width - 160)) / maxDepth;
    if (node.symbol !== null) {
      const y = (minY + maxY) / 2;
      positions.set(node.id, { x, y, node, depth });
    } else {
      const leftLeaves = countLeaves(node.left);
      const rightLeaves = countLeaves(node.right);
      const totalLeaves = leftLeaves + rightLeaves;
      if (totalLeaves === 0) {
        const y = (minY + maxY) / 2;
        positions.set(node.id, { x, y, node, depth });
        return;
      }
      const availableSpace = maxY - minY;
      const nodeHeight = 50;
      const minSeparation = 70;
      const requiredSpace = totalLeaves * nodeHeight + (totalLeaves - 1) * minSeparation;
      const actualSpace = Math.max(availableSpace, requiredSpace);
      const leftSpace = leftLeaves > 0 ? (leftLeaves / totalLeaves) * actualSpace : 0;
      const rightSpace = rightLeaves > 0 ? (rightLeaves / totalLeaves) * actualSpace : 0;
      const leftMinY = minY;
      const leftMaxY = leftSpace > 0 ? minY + leftSpace - minSeparation/2 : minY;
      const rightMinY = leftSpace > 0 ? minY + leftSpace + minSeparation/2 : minY;
      const rightMaxY = minY + actualSpace;
      if (node.left) {
        assignPositions(node.left, depth + 1, leftMinY, leftMaxY);
      }
      if (node.right) {
        assignPositions(node.right, depth + 1, rightMinY, rightMaxY);
      }
      let parentY = (minY + maxY) / 2;
      if (node.left && node.right) {
        const leftPos = positions.get(node.left.id);
        const rightPos = positions.get(node.right.id);
        if (leftPos && rightPos) {
          parentY = (leftPos.y + rightPos.y) / 2;
        }
      } else if (node.left) {
        const leftPos = positions.get(node.left.id);
        if (leftPos) parentY = leftPos.y;
      } else if (node.right) {
        const rightPos = positions.get(node.right.id);
        if (rightPos) parentY = rightPos.y;
      }
      positions.set(node.id, { x, y: parentY, node, depth });
      const svg = document.getElementById('tree-svg');
      if (svg && actualSpace > height) {
        const newHeight = actualSpace + 100;
        svg.setAttribute('height', newHeight);
        svg.setAttribute('viewBox', `0 0 ${width} ${newHeight}`);
      }
    }
  }
  assignPositions(tree, 0, 50, height - 50);
  return positions;
}

function drawHorizontalConnections(svg, tree, positions) {
  function drawEdges(node) {
    if (!node) return;
    const nodePos = positions.get(node.id);
    if (node.left) {
      const leftPos = positions.get(node.left.id);
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', nodePos.x + 25);
      line1.setAttribute('y1', nodePos.y);
      line1.setAttribute('x2', leftPos.x - 25);
      line1.setAttribute('y2', leftPos.y);
      line1.setAttribute('class', 'tree-edge');
      svg.appendChild(line1);
      const midX = (nodePos.x + leftPos.x) / 2;
      const midY = leftPos.y - 15;
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX);
      label.setAttribute('y', midY);
      label.setAttribute('class', 'tree-code-label code-0');
      label.textContent = '0';
      svg.appendChild(label);
      drawEdges(node.left);
    }
    if (node.right) {
      const rightPos = positions.get(node.right.id);
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', nodePos.x + 25);
      line1.setAttribute('y1', nodePos.y);
      line1.setAttribute('x2', rightPos.x - 25);
      line1.setAttribute('y2', rightPos.y);
      line1.setAttribute('class', 'tree-edge');
      svg.appendChild(line1);
      const midX = (nodePos.x + rightPos.x) / 2;
      const midY = rightPos.y - 15;
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX);
      label.setAttribute('y', midY);
      label.setAttribute('class', 'tree-code-label code-1');
      label.textContent = '1';
      svg.appendChild(label);
      drawEdges(node.right);
    }
  }
  drawEdges(tree);
}

function drawHorizontalNodes(svg, tree, positions) {
  positions.forEach(({ x, y, node, depth }) => {
    const isLeaf = node.symbol !== null;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - 25);
    rect.setAttribute('y', y - 15);
    rect.setAttribute('width', 50);
    rect.setAttribute('height', 30);
    rect.setAttribute('rx', 8);
    rect.setAttribute('class', isLeaf ? 'tree-node symbol-node' : 'tree-node');
    svg.appendChild(rect);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y + 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '600');
    text.setAttribute('fill', 'var(--text-primary)');
    text.style.pointerEvents = 'none';
    if (isLeaf) {
      text.textContent = node.symbol;
    } else {
      text.textContent = node.prob.toFixed(2);
    }
    svg.appendChild(text);
    if (isLeaf) {
      const probText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      probText.setAttribute('x', x);
      probText.setAttribute('y', y + 25);
      probText.setAttribute('text-anchor', 'middle');
      probText.setAttribute('dominant-baseline', 'central');
      probText.setAttribute('font-family', 'Inter, sans-serif');
      probText.setAttribute('font-size', '10');
      probText.setAttribute('font-weight', '400');
      probText.setAttribute('fill', '#94a3b8');
      probText.style.pointerEvents = 'none';
      probText.textContent = node.prob.toFixed(3);
      svg.appendChild(probText);
    }
  });
}

export function showTooltip(event, node, currentSymbols, currentCodes) {
  const tooltip = document.getElementById('custom-tooltip');
  const titleElement = document.getElementById('tooltip-title');
  const probElement = document.getElementById('tooltip-prob');
  const codeElement = document.getElementById('tooltip-code');
  const infoElement = document.getElementById('tooltip-info');
  const symbol = currentSymbols.find(s => s.symbol === node.symbol);
  const code = currentCodes[node.symbol] || 'N/A';
  titleElement.textContent = `Símbolo: ${node.symbol}`;
  probElement.textContent = node.prob.toFixed(4);
  codeElement.textContent = code;
  infoElement.textContent = symbol ? `${symbol.info.toFixed(3)} bits` : 'N/A';
  tooltip.classList.add('show');
  moveTooltip(event);
}

export function hideTooltip() {
  const tooltip = document.getElementById('custom-tooltip');
  tooltip.classList.remove('show');
}

export function moveTooltip(event) {
  const tooltip = document.getElementById('custom-tooltip');
  const rect = tooltip.getBoundingClientRect();
  let x = event.pageX + 15;
  let y = event.pageY - 10;
  if (x + rect.width > window.innerWidth) {
    x = event.pageX - rect.width - 15;
  }
  if (y < 0) {
    y = event.pageY + 25;
  }
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

export function animateTreeConstruction(currentTree) {
  const svg = document.getElementById('tree-svg');
  svg.innerHTML = '';
  const elements = svg.querySelectorAll('*');
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transition = 'opacity 0.5s ease-in-out';
    }, i * 100);
  });
  setTimeout(() => {
    drawSVGTree(currentTree);
    const newElements = svg.querySelectorAll('*');
    newElements.forEach((el, i) => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.5s ease-in-out';
      }, i * 50);
    });
  }, 200);
}

export function exportTreeAsSVG(currentTree) {
  const svg = document.getElementById('tree-svg');
  if (!svg) {
    alert('No se pudo encontrar el árbol para exportar.');
    return;
  }
  const svgClone = svg.cloneNode(true);
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    .tree-node {
      fill: white;
      stroke: #2563eb;
      stroke-width: 2;
      rx: 8;
    }
    .symbol-node {
      fill: #dcfce7;
      stroke: #059669;
    }
    .tree-edge {
      stroke: #64748b;
      stroke-width: 2;
      fill: none;
    }
    .tree-code-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: central;
    }
    .code-0 { fill: #dc2626; }
    .code-1 { fill: #059669; }
    text {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      fill: #1e293b;
      text-anchor: middle;
      dominant-baseline: central;
    }
  `;
  svgClone.insertBefore(style, svgClone.firstChild);
  const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  titleText.setAttribute('x', svgClone.getAttribute('width') / 2);
  titleText.setAttribute('y', 30);
  titleText.setAttribute('text-anchor', 'middle');
  titleText.setAttribute('font-size', '18');
  titleText.setAttribute('font-weight', 'bold');
  titleText.setAttribute('fill', '#1e293b');
  titleText.textContent = 'Árbol de Huffman - Facundo Sichi';
  titleGroup.appendChild(titleText);
  const subtitleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  subtitleText.setAttribute('x', svgClone.getAttribute('width') / 2);
  subtitleText.setAttribute('y', 50);
  subtitleText.setAttribute('text-anchor', 'middle');
  subtitleText.setAttribute('font-size', '12');
  subtitleText.setAttribute('fill', '#64748b');
  subtitleText.textContent = `Generado el ${new Date().toLocaleString('es-ES')}`;
  titleGroup.appendChild(subtitleText);
  svgClone.insertBefore(titleGroup, svgClone.firstChild);
  const currentViewBox = svgClone.getAttribute('viewBox').split(' ');
  currentViewBox[1] = '-60';
  currentViewBox[3] = parseInt(currentViewBox[3]) + 60;
  svgClone.setAttribute('viewBox', currentViewBox.join(' '));
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  a.download = `huffman_tree_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function displayTree(currentTree) {
  document.getElementById('tree-text').textContent = drawTree(currentTree);
  document.getElementById('tree-text').style.display = 'none';
  setTimeout(() => drawSVGTree(currentTree), 300);
}

function drawTree(node, prefix = '', isLeft = true) {
  if (!node) return '';
  const nodeLabel = node.symbol !== null ? 
    `[${node.symbol}] ${node.prob.toFixed(3)}` : 
    `{${node.prob.toFixed(3)}}`;
  let result = prefix + (prefix ? (isLeft ? '├── ' : '└── ') : '') + nodeLabel + '\n';
  if (node.left || node.right) {
    const newPrefix = prefix + (prefix ? (isLeft ? '│   ' : '    ') : '');
    if (node.left) result += drawTree(node.left, newPrefix, true);
    if (node.right) result += drawTree(node.right, newPrefix, false);
  }
  return result;
}
