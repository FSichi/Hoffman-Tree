// Variables globales para la visualización del árbol
let currentTree = null;
let currentSymbols = null;
let currentCodes = null;
let treeAnimationSpeed = 1000;

// Detectar dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// Inicializar tabs al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    
    // Optimizaciones específicas para móvil
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
        
        // Prevenir zoom automático en inputs para iOS
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Mejorar scroll en contenedores con árboles
        const treeContainers = document.querySelectorAll('.tree-container-responsive');
        treeContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            // Eliminar eventos táctiles personalizados - usar scroll nativo
        });
    }
});

// Funciones auxiliares para cálculos del árbol
function getMaxDepth(node, depth = 0) {
    if (!node) return depth;
    if (node.symbol !== null) return depth; // es hoja
    return Math.max(
        getMaxDepth(node.left, depth + 1),
        getMaxDepth(node.right, depth + 1)
    );
}

function countLeavesInTree(node) {
    if (!node) return 0;
    if (node.symbol !== null) return 1; // es hoja
    return countLeavesInTree(node.left) + countLeavesInTree(node.right);
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        // Evento click estándar
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
        
        // Mejorar experiencia táctil en móvil
        let touchStartTime = 0;
        
        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.8';
        }, { passive: true });
        
        button.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Solo procesar si fue un toque corto (no un scroll)
            if (touchDuration < 200) {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
            }
            
            // Restaurar estilos
            button.style.transform = '';
            button.style.opacity = '';
        }, { passive: false });
        
        button.addEventListener('touchcancel', () => {
            button.style.transform = '';
            button.style.opacity = '';
        });
    });
}

function switchTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Actualizar paneles
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabId}-panel`).classList.add('active');
    
    // Si es el tab del árbol, redibujar el SVG y reinitializar scroll
    if (tabId === 'tree' && currentTree) {
        setTimeout(() => {
            drawSVGTree(currentTree);
            
            // Reinitializar comportamiento de scroll para móvil
            if (isMobileDevice()) {
                const container = document.querySelector('.tree-container-responsive');
                if (container) {
                    // Asegurar que el scroll esté en el inicio
                    container.scrollLeft = 0;
                    
                    // Solo forzar scroll horizontal suave, no bloquear vertical
                    container.style.webkitOverflowScrolling = 'touch';
                }
            }
        }, 100);
    }
}

document.getElementById('input-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const input = document.getElementById('input-data').value.trim();
  const channelRate = parseFloat(document.getElementById('channel-rate').value);
  const lines = input.split('\n');
  const symbols = [];
  const seenSymbols = new Set();
  let totalProb = 0;

  // Mostrar loading
  showLoading();

  // Simular tiempo de procesamiento para mostrar la animación
  setTimeout(() => {
    for (const line of lines) {
      if (!line.includes(',')) continue;
      const [symbolRaw, probStr] = line.split(',').map(s => s.trim());
      const symbol = symbolRaw || '␣'; // símbolo visible si vacío
      const prob = parseFloat(probStr);

      if (!symbol || isNaN(prob) || prob < 0 || prob > 1 || seenSymbols.has(symbol)) {
        hideLoading();
        alert('Entrada inválida en la línea: ' + line);
        return;
      }

      seenSymbols.add(symbol);
      totalProb += prob;
      symbols.push({ symbol, prob });
    }

    if (symbols.length < 2) {
      hideLoading();
      alert('Debe ingresar al menos 2 símbolos válidos.');
      return;
    }

    if (Math.abs(totalProb - 1) > 0.01) {
      hideLoading();
      alert('La suma de las probabilidades debe ser igual a 1.');
      return;
    }

    if (isNaN(channelRate) || channelRate <= 0) {
      hideLoading();
      alert('Tasa de canal inválida.');
      return;
    }

    // Calcular info y entropía
    let entropy = 0;
    symbols.forEach(s => {
      s.info = -Math.log2(s.prob);
      entropy += s.prob * s.info;
    });

    // Generar árbol de Huffman
    const tree = buildHuffmanTree(symbols.map(s => ({ symbol: s.symbol, prob: s.prob })));
    currentTree = tree;
    const codes = {};
    buildCode(tree, '', codes);

    // Asignar códigos a símbolos
    symbols.forEach(s => {
      s.code = codes[s.symbol];
      s.length = codes[s.symbol].length;
    });

    currentSymbols = symbols;
    currentCodes = codes;

    const avgLength = symbols.reduce((sum, s) => sum + s.prob * s.length, 0);
    const efficiency = entropy / avgLength;
    const channelEfficiency = entropy / channelRate;

    hideLoading();
    displayResults(symbols, entropy, avgLength, efficiency, channelEfficiency);
    
    // Habilitar botón de exportar
    document.getElementById('export-button').disabled = false;
  }, 800);
});

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function displayResults(symbols, entropy, avgLength, efficiency, channelEfficiency) {
  // Mostrar la sección de resultados
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';
  resultsSection.classList.add('fade-in');
  
  // Scroll suave a los resultados
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Llenar estadísticas en el tab de resumen
  displayOverview(symbols, entropy, avgLength, efficiency, channelEfficiency);
  
  // Llenar tabla detallada
  displayTable(symbols);
  
  // Configurar árbol
  displayTree();
}

function displayOverview(symbols, entropy, avgLength, efficiency, channelEfficiency) {
  // Estadísticas
  const statsHTML = `
    <div class="stat-card">
      <div class="stat-value">${entropy.toFixed(3)}</div>
      <div class="stat-label">Entropía (bits)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${avgLength.toFixed(3)}</div>
      <div class="stat-label">Longitud Media</div>
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
  
  // Lista de códigos
  const codesHTML = symbols.map(s => `
    <div class="code-item">
      <span class="code-symbol">${s.symbol}</span>
      <span class="code-value">${s.code}</span>
    </div>
  `).join('');
  
  document.getElementById('codes-list').innerHTML = codesHTML;
}

function displayTable(symbols) {
  const tableRows = symbols.map(s => `
    <tr class="fade-in">
      <td><strong>${s.symbol}</strong></td>
      <td>${s.prob.toFixed(4)}</td>
      <td>${s.info.toFixed(3)}</td>
      <td><code>${s.code}</code></td>
      <td>${s.length}</td>
    </tr>
  `).join('');

  const tableHTML = `
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

function displayTree() {
  // Mostrar representación textual (oculta por defecto)
  document.getElementById('tree-text').textContent = drawTree(currentTree);
  document.getElementById('tree-text').style.display = 'none';
  
  // Dibujar árbol SVG horizontal
  setTimeout(() => drawSVGTree(currentTree), 300); // Pequeño delay para la animación
}

// ---------------- Huffman + Árbol ----------------

function buildHuffmanTree(symbols) {
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

function buildCode(node, code = '', map = {}) {
  if (node.symbol !== null) {
    map[node.symbol] = code || '0'; // Si solo hay un símbolo, asignar '0'
  } else {
    // CORRIGIENDO: izquierda = 0, derecha = 1 (como en la imagen)
    if (node.left) buildCode(node.left, code + '0', map);
    if (node.right) buildCode(node.right, code + '1', map);
  }
  return map;
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

// ---------------- Visualización SVG del Árbol ----------------

function drawSVGTree(tree) {
  const svg = document.getElementById('tree-svg');
  const container = svg.parentElement;
  const isMobile = window.innerWidth <= 768;
  
  // En móvil, usar ancho fijo para mantener espaciado original
  let width;
  if (isMobile) {
    // Calcular ancho basado en la estructura del árbol
    const treeDepth = getMaxDepth(tree);
    const leafCount = countLeavesInTree(tree);
    // Usar ancho generoso para preservar espaciado en móvil
    width = Math.max(1200, leafCount * 150, treeDepth * 200);
  } else {
    width = container.clientWidth - 40;
  }
  
  const height = 600; // Altura inicial más grande
  
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = '';

  // En móvil, asegurar que el SVG mantenga su ancho mínimo
  if (isMobile) {
    svg.style.minWidth = `${width}px`;
    svg.style.width = `${width}px`;
  }

  if (!tree) return;

  // Calcular posiciones horizontales (como en la imagen)
  const positions = calculateHorizontalNodePositions(tree, width, height);
  
  // Dibujar conexiones primero
  drawHorizontalConnections(svg, tree, positions);
  
  // Dibujar nodos
  drawHorizontalNodes(svg, tree, positions);
  
  // Inicializar scroll móvil después de dibujar
  if (isMobile) {
    setTimeout(() => {
      const container = document.querySelector('.tree-container-responsive');
      if (container) {
        container.scrollLeft = 0; // Resetear scroll horizontal
      }
    }, 50);
  }
}

function calculateHorizontalNodePositions(tree, width, height) {
  const positions = new Map();
  
  // Función para calcular la profundidad máxima del árbol
  function getMaxDepth(node, depth = 0) {
    if (!node) return depth;
    if (node.symbol !== null) return depth; // es hoja
    return Math.max(
      getMaxDepth(node.left, depth + 1),
      getMaxDepth(node.right, depth + 1)
    );
  }
  
  // Función para contar hojas en todo el árbol (función auxiliar global)
  function countLeavesInTree(node) {
    if (!node) return 0;
    if (node.symbol !== null) return 1; // es hoja
    return countLeavesInTree(node.left) + countLeavesInTree(node.right);
  }
  
  const maxDepth = getMaxDepth(tree);
  
  // Función para contar el número de hojas en un subárbol
  function countLeaves(node) {
    if (!node) return 0;
    if (node.symbol !== null) return 1; // es hoja
    return countLeaves(node.left) + countLeaves(node.right);
  }
  
  // Función mejorada para asignar posiciones evitando superposiciones
  function assignPositions(node, depth = 0, minY = 0, maxY = height) {
    if (!node) return;
    
    // Posición X basada en el nivel
    const x = 80 + (depth * (width - 160)) / maxDepth;
    
    if (node.symbol !== null) {
      // Es una hoja - posicionar en el centro del espacio asignado
      const y = (minY + maxY) / 2;
      positions.set(node.id, { x, y, node, depth });
    } else {
      // Es un nodo interno - calcular posición basada en los hijos
      const leftLeaves = countLeaves(node.left);
      const rightLeaves = countLeaves(node.right);
      const totalLeaves = leftLeaves + rightLeaves;
      
      if (totalLeaves === 0) {
        const y = (minY + maxY) / 2;
        positions.set(node.id, { x, y, node, depth });
        return;
      }
      
      // Calcular espacios proporcionales para cada subárbol
      const availableSpace = maxY - minY;
      const nodeHeight = 50; // Altura mínima para un nodo
      const minSeparation = 70; // Separación mínima entre nodos hermanos
      
      // Asegurar que hay suficiente espacio
      const requiredSpace = totalLeaves * nodeHeight + (totalLeaves - 1) * minSeparation;
      const actualSpace = Math.max(availableSpace, requiredSpace);
      
      // Redistribuir el espacio disponible
      const leftSpace = leftLeaves > 0 ? (leftLeaves / totalLeaves) * actualSpace : 0;
      const rightSpace = rightLeaves > 0 ? (rightLeaves / totalLeaves) * actualSpace : 0;
      
      // Calcular los rangos para los hijos
      const leftMinY = minY;
      const leftMaxY = leftSpace > 0 ? minY + leftSpace - minSeparation/2 : minY;
      const rightMinY = leftSpace > 0 ? minY + leftSpace + minSeparation/2 : minY;
      const rightMaxY = minY + actualSpace;
      
      // Asignar posiciones a los hijos primero
      if (node.left) {
        assignPositions(node.left, depth + 1, leftMinY, leftMaxY);
      }
      if (node.right) {
        assignPositions(node.right, depth + 1, rightMinY, rightMaxY);
      }
      
      // Posicionar el nodo padre en el centro de sus hijos
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
      
      // Actualizar altura del SVG si es necesario
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
      
      // Línea principal horizontal
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', nodePos.x + 25); // desde el borde derecho del nodo
      line1.setAttribute('y1', nodePos.y);
      line1.setAttribute('x2', leftPos.x - 25); // hasta el borde izquierdo del nodo hijo
      line1.setAttribute('y2', leftPos.y);
      line1.setAttribute('class', 'tree-edge');
      svg.appendChild(line1);
      
      // Etiqueta del código '0' (izquierda)
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
      
      // Línea principal horizontal
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', nodePos.x + 25);
      line1.setAttribute('y1', nodePos.y);
      line1.setAttribute('x2', rightPos.x - 25);
      line1.setAttribute('y2', rightPos.y);
      line1.setAttribute('class', 'tree-edge');
      svg.appendChild(line1);
      
      // Etiqueta del código '1' (derecha)
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
    
    // Rectángulo del nodo (como en la imagen)
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - 25);
    rect.setAttribute('y', y - 15);
    rect.setAttribute('width', 50);
    rect.setAttribute('height', 30);
    rect.setAttribute('rx', 8);
    rect.setAttribute('class', isLeaf ? 'tree-node symbol-node' : 'tree-node');
    
    // Agregar eventos para tooltip
    if (isLeaf && currentCodes) {
      rect.addEventListener('mouseenter', (e) => showTooltip(e, node));
      rect.addEventListener('mouseleave', hideTooltip);
      rect.addEventListener('mousemove', moveTooltip);
      rect.style.cursor = 'pointer';
    }
    
    svg.appendChild(rect);
    
    // Texto del nodo
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'tree-text-element');
    text.style.pointerEvents = 'none'; // Para que no interfiera con el tooltip
    
    if (isLeaf) {
      // Para hojas, mostrar el símbolo
      text.textContent = node.symbol;
    } else {
      // Para nodos internos, mostrar la probabilidad
      text.textContent = node.prob.toFixed(2);
    }
    
    svg.appendChild(text);
    
    // Probabilidad pequeña debajo (solo para hojas)
    if (isLeaf) {
      const probText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      probText.setAttribute('x', x);
      probText.setAttribute('y', y + 25);
      probText.setAttribute('class', 'tree-text-element');
      probText.style.fontSize = '10px';
      probText.style.fill = '#94a3b8';
      probText.style.pointerEvents = 'none';
      probText.textContent = node.prob.toFixed(3);
      svg.appendChild(probText);
    }
  });
}

// Funciones para el tooltip
function showTooltip(event, node) {
  const tooltip = document.getElementById('custom-tooltip');
  const titleElement = document.getElementById('tooltip-title');
  const probElement = document.getElementById('tooltip-prob');
  const codeElement = document.getElementById('tooltip-code');
  const infoElement = document.getElementById('tooltip-info');
  
  // Obtener información del símbolo
  const symbol = currentSymbols.find(s => s.symbol === node.symbol);
  const code = currentCodes[node.symbol] || 'N/A';
  
  titleElement.textContent = `Símbolo: ${node.symbol}`;
  probElement.textContent = node.prob.toFixed(4);
  codeElement.textContent = code;
  infoElement.textContent = symbol ? `${symbol.info.toFixed(3)} bits` : 'N/A';
  
  tooltip.classList.add('show');
  moveTooltip(event);
}

function hideTooltip() {
  const tooltip = document.getElementById('custom-tooltip');
  tooltip.classList.remove('show');
}

function moveTooltip(event) {
  const tooltip = document.getElementById('custom-tooltip');
  const rect = tooltip.getBoundingClientRect();
  
  let x = event.pageX + 15;
  let y = event.pageY - 10;
  
  // Ajustar posición si se sale de la pantalla
  if (x + rect.width > window.innerWidth) {
    x = event.pageX - rect.width - 15;
  }
  
  if (y < 0) {
    y = event.pageY + 25;
  }
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

// ---------------- Animaciones del Árbol ----------------

document.getElementById('animate-tree').addEventListener('click', () => {
  if (!currentTree) return;
  animateTreeConstruction();
});

function animateTreeConstruction() {
  const svg = document.getElementById('tree-svg');
  svg.innerHTML = '';
  
  // Simular la construcción paso a paso del árbol
  // Por simplicidad, solo redibujamos con una animación
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

// ---------------- Exportar a TXT ----------------

document.getElementById('export-button').addEventListener('click', () => {
  const table = document.querySelector('#results table');
  if (!table) {
    alert('No hay resultados para exportar.');
    return;
  }

  let text = 'ANÁLISIS DE CODIFICACIÓN HUFFMAN\n';
  text += '================================\n\n';
  text += 'Símbolo,Probabilidad,Información (bits),Código,Longitud\n';
  
  table.querySelectorAll('tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowData = Array.from(cells).map(td => td.textContent.replace('&nbsp;', ' ')).join(',');
    text += rowData + '\n';
  });

  // Agregar estadísticas
  const stats = document.querySelectorAll('.stat-card');
  if (stats.length > 0) {
    text += '\nESTADÍSTICAS:\n';
    text += '=============\n';
    stats.forEach(stat => {
      const value = stat.querySelector('.stat-value').textContent;
      const label = stat.querySelector('.stat-label').textContent;
      text += `${label}: ${value}\n`;
    });
  }

  // Agregar representación del árbol
  if (currentTree) {
    text += '\nÁRBOL DE HUFFMAN:\n';
    text += '=================\n';
    text += drawTree(currentTree);
  }

  const blob = new Blob([text], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analisis_huffman.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// ---------------- Responsive Tree ----------------

window.addEventListener('resize', () => {
  if (currentTree) {
    setTimeout(() => drawSVGTree(currentTree), 100);
  }
});
