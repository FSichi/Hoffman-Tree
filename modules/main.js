// Inicialización, eventos DOM, tabs, integración de módulos
import { buildHuffmanTree, buildCode, displayResults, exportCompleteAnalysis } from './huffman-calc.js';
import { drawSVGTree, animateTreeConstruction, exportTreeAsSVG, showTooltip, hideTooltip, moveTooltip } from './tree-visual.js';

let currentTree = null;
let currentSymbols = null;
let currentCodes = null;

function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
}

document.addEventListener('DOMContentLoaded', function() {
        initializeTabs();
        if (isMobileDevice()) {
                document.body.classList.add('mobile-device');
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
                const treeContainers = document.querySelectorAll('.tree-container-responsive');
                treeContainers.forEach(container => {
                        container.style.webkitOverflowScrolling = 'touch';
                });
        }
});

function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const tabId = button.getAttribute('data-tab');
                        switchTab(tabId);
                });
                let touchStartTime = 0;
                button.addEventListener('touchstart', (e) => {
                        touchStartTime = Date.now();
                        button.style.transform = 'scale(0.95)';
                        button.style.opacity = '0.8';
                }, { passive: true });
                button.addEventListener('touchend', (e) => {
                        const touchDuration = Date.now() - touchStartTime;
                        if (touchDuration < 200) {
                                e.preventDefault();
                                const tabId = button.getAttribute('data-tab');
                                switchTab(tabId);
                        }
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
        document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-panel`).classList.add('active');
        if (tabId === 'tree' && currentTree) {
                setTimeout(() => {
                        drawSVGTree(currentTree);
                        if (isMobileDevice()) {
                                const container = document.querySelector('.tree-container-responsive');
                                if (container) {
                                        container.scrollLeft = 0;
                                        container.scrollTop = 0;
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
    showLoading();
    setTimeout(() => {
        for (const line of lines) {
            if (!line.includes(',')) continue;
            const [symbolRaw, probStr] = line.split(',').map(s => s.trim());
            const symbol = symbolRaw || '␣';
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
        let entropy = 0;
        symbols.forEach(s => {
            s.info = -Math.log2(s.prob);
            entropy += s.prob * s.info;
        });
        const tree = buildHuffmanTree(symbols.map(s => ({ symbol: s.symbol, prob: s.prob })));
        currentTree = tree;
        const codes = {};
        buildCode(tree, '', codes);
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
        const exportButton = document.getElementById('export-button');
        const exportSvgButton = document.getElementById('export-svg-button');
        if (exportButton) {
            exportButton.disabled = false;
            exportButton.style.opacity = '1';
            exportButton.style.pointerEvents = 'auto';
        }
        if (exportSvgButton) {
            exportSvgButton.disabled = false;
            exportSvgButton.style.opacity = '1';
            exportSvgButton.style.pointerEvents = 'auto';
        }
    }, 800);
});

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

document.getElementById('animate-tree').addEventListener('click', () => {
    if (!currentTree) return;
    animateTreeConstruction(currentTree);
});

document.getElementById('export-button').addEventListener('click', () => {
    if (!currentSymbols || !currentCodes || !currentTree) {
        alert('No hay resultados para exportar. Por favor, genera los códigos primero.');
        return;
    }
    exportCompleteAnalysis(currentSymbols, currentCodes, currentTree);
});

document.getElementById('export-svg-button').addEventListener('click', () => {
    if (!currentTree) {
        alert('No hay árbol para exportar. Por favor, genera los códigos primero.');
        return;
    }
    exportTreeAsSVG(currentTree);
});

window.addEventListener('resize', () => {
    if (currentTree) {
        setTimeout(() => drawSVGTree(currentTree), 100);
    }
});
