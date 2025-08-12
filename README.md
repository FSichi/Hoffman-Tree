
# Informe académico: Visualizador y Codificador de Huffman

## Descripción general
Esta aplicación web implementa el algoritmo de Huffman para la codificación óptima de fuentes, permitiendo visualizar el árbol, los códigos generados y analizar la eficiencia del código y del canal. Fue desarrollada como proyecto académico para la materia Teoría de la Información.

## ¿Cómo funciona el algoritmo de Huffman?
El algoritmo de Huffman es un método de compresión sin pérdida que asigna códigos binarios más cortos a los símbolos más probables y códigos más largos a los menos probables. El proceso es:
1. Se ordenan los símbolos por probabilidad.
2. Se combinan los dos símbolos de menor probabilidad en un nodo nuevo, sumando sus probabilidades.
3. Se repite el proceso hasta que queda un solo nodo (la raíz del árbol).
4. Se asigna '0' a cada rama izquierda y '1' a cada rama derecha, recorriendo el árbol para obtener los códigos de cada símbolo.

## Ejemplo de cálculo paso a paso
Supongamos la siguiente entrada:

```
Símbolo | Probabilidad
--------|-------------
A       | 0.40
B       | 0.20
C       | 0.16
D       | 0.10
E       | 0.07
F       | 0.04
G       | 0.02
H       | 0.01
```

**1. Entropía:**

	H = -∑ p(x) * log₂ p(x)
	H = -(0.40*log₂0.40 + 0.20*log₂0.20 + ... + 0.01*log₂0.01)
	H ≈ 2.38 bits/símbolo

**2. Longitud media del código:**

	L = ∑ p(x) * l(x)
	(donde l(x) es la longitud del código de cada símbolo generado por Huffman)
	Ejemplo: si A=2 bits, B=3 bits, ...
	L ≈ 2.44 bits/símbolo

**3. Eficiencia del código:**

	Eficiencia = H / L ≈ 2.38 / 2.44 ≈ 0.97 (97%)

**4. Redundancia:**

	Redundancia = L - H ≈ 2.44 - 2.38 ≈ 0.06 bits/símbolo

**5. Eficiencia del canal:**

	Si la tasa del canal es C = 3 bits/símbolo:
	Eficiencia canal = H / C ≈ 2.38 / 3 ≈ 0.79 (79%)

**Nota:** Los valores exactos dependen de los códigos generados por el árbol de Huffman. (Teniendo en cuenta los nodos y la asignación de códigos, los cálculos pueden variar ligeramente.)

## Cálculo de eficiencia, entropía y redundancia

### Entropía
La **entropía** de la fuente se calcula como:

	H = -∑ p(x) * log₂ p(x)

donde p(x) es la probabilidad de cada símbolo. Representa el límite teórico inferior de la longitud media de cualquier código sin pérdida para esa fuente.

### Longitud media del código
La **longitud media** del código generado es:

	L = ∑ p(x) * l(x)

donde l(x) es la longitud (en bits) del código asignado a cada símbolo x.

### Eficiencia del código
La **eficiencia del código** mide cuán cerca está el código generado del límite teórico (entropía):

	Eficiencia del código = H / L

Valores cercanos a 1 (o 100%) indican un código óptimo, sin redundancia.

### Redundancia
La **redundancia** es la diferencia entre la longitud media y la entropía:

	Redundancia = L - H

Indica cuántos bits extra, en promedio, se usan respecto al mínimo teórico.

### Eficiencia del canal
La **eficiencia del canal** compara la entropía de la fuente con la tasa máxima del canal (capacidad):

	Eficiencia del canal = H / C

donde C es la tasa del canal (bits/símbolo). Indica qué porcentaje de la capacidad del canal se utiliza para transmitir información útil.

### Referencias teóricas

- Cátedra de Comunicaciones U.T.N F.R.T @2025.
- Cover & Thomas, Elements of Information Theory
- MacKay, Information Theory, Inference, and Learning Algorithms

## Desarrollo de la aplicación

## Cómo correr el proyecto

1. Descarga o clona este repositorio.
2. Abre el archivo `index.html` en tu navegador web (no requiere servidor, pero si tienes problemas de rutas puedes usar una extensión de servidor local como Live Server en VS Code).
3. Ingresa los datos y prueba la aplicación.

## Limitaciones y mejoras futuras

- Mejorar la validación para aceptar probabilidades menores a 1 (actualmente requiere que sumen exactamente 1).
- Permitir exportar resultados en otros formatos (CSV, PDF).
- Mejorar la accesibilidad y compatibilidad con navegadores antiguos.

## Créditos y licencia

Desarrollado por Facundo Sichi para la cátedra de Comunicaciones, UTN FRT, 2025. Uso académico y educativo.

- **Frontend:** HTML5, CSS3 (responsive, diseño académico), JavaScript (ES6+)
- **Algoritmo:** Implementación propia del algoritmo de Huffman, generación de árbol y códigos binarios óptimos.
- **Visualización:** Dibujo SVG del árbol de Huffman, animaciones, tooltips interactivos, exportación de resultados y árbol.
- **Modularización:** El código está organizado en módulos:
	- `huffman-calc.js`: lógica de cálculo, generación de árbol, códigos y estadísticas.
	- `tree-visual.js`: visualización, animaciones y exportación SVG.
	- `main.js`: inicialización, eventos y conexión de módulos.
- **Validaciones:** El sistema valida que las probabilidades sumen 1, que los datos sean correctos y que la tasa de canal sea válida. (Aun me queda pendiente mejorar que se puedan usar probabilidades menores a 1.)
- **Exportación:** Permite exportar el análisis completo y el árbol en formato SVG.

## Ejemplo de entrada
```
A,0.40
B,0.20
C,0.16
D,0.10
E,0.07
F,0.04
G,0.02
H,0.01
```

## Uso
1. Ingresar los símbolos y sus probabilidades (una línea por símbolo, separadas por coma).
2. Ingresar la tasa del canal.
3. Presionar "Generar Códigos" para ver el árbol, los códigos y las estadísticas.
4. Exportar el análisis o el árbol SVG si se desea.
