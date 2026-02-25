# 📦 Módulo de Logística — Checklist de Features
> Referencia: App **LogisKei** (logis.keinerchara.com)  
> Objetivo: Replicar funcionalidades en **Pixora > LogisticsView.tsx**

---

## ✅ IMPLEMENTADO (hasta ahora)

- [x] Subir Excel de Dropi y procesar datos
- [x] Menú principal (Subir Reporte, Diario de Pauta, Ver Historial)
- [x] KPI Bar: Total Pedidos | Total Guías | % Confirmación | % Cancelación
- [x] Card Finanzas Reales (naranja): Ventas, Costo Prov, Fletes Ent, Fletes Dev
- [x] Pago Anticipado (sin recaudo)
- [x] Proyección de tránsito: 100% | 90% | 80% | 70% | 60%
- [x] Input Gasto en Pauta + Ganancia Neta Real
- [x] Cards clickeables de efectividad: Efectividad Entrega | En Tránsito Global | Tasa Devolución
- [x] Modal Efectividad: Por Transportadora (cards) + Por Producto (barras)
- [x] Status cards Fila 1: Pend. Confirmación | Pend. Envío | En Novedad | Reclamar Oficina | Tránsito Total
- [x] Status cards Fila 2: Entregados | Devoluciones | Cancelados | Rechazados
- [x] Tabla Efectividad Transportadora: Empresa | Enviados | Tránsito | Dev | Cancel | Rechazados | Entregados
- [x] Vista detalle con búsqueda y filtros (Todos / Con Recaudo / Sin Recaudo)
- [x] Descarga CSV de la vista detalle
- [x] Historial de reportes guardados en Supabase
- [x] Toast notifications (reemplaza alert nativo)
- [x] Guardar reporte automáticamente al subir Excel

---

## 🔲 PENDIENTE DE IMPLEMENTAR

### 🟠 Prioridad ALTA

#### 1. Vista Detalle — Diseño mejorado (como LogisKei)
**Referencia:** Pantallazos de Pend. Confirmación, Novedades, En Oficina, Tránsito, Entregados, Devoluciones
- [x] Header del modal con color según estado (naranja=confirmación, amarillo=novedad, morado=oficina, azul=tránsito, verde=entregados, rojo=devoluciones)
- [x] Cada fila muestra: 
  - ID grande + Guía debajo (gris pequeño)
  - Transportadora (badge)
  - Badge CON RECAUDO / SIN RECAUDO (verde/gris)
  - Cliente (nombre + guía repetida)
  - Ciudad, Departamento
  - Producto, Cantidad
  - Estado (en color)
  - Días en movimiento con ícono ⚠️ (rojo si > 7 días)
  - Columna VALORES: Total | Flete (-) | Proveedor (-) | **Utilidad** (verde/rojo)
- [ ] Filtro por fecha (desde → hasta)
- [x] Modal como overlay (no como subview), con header colorido y "Mostrando X de Y pedidos"

#### 2. Tabla de Rentabilidad por Producto
**Referencia:** Pantallazo "Rentabilidad por Producto" (minuto 5:35)
- [x] Tabla con columnas: Producto | Entr | % Efec | Trán | % Trán | Dev | % Dev | Ventas | Pauta | Utilidad
- [x] Columna Pauta: input editable por producto (se guarda localmente)
- [ ] Al hacer clic en fila → modal de producto
- [ ] Modal de producto: Ventas | Costos | Input "Inversión en Publicidad (Ads)" | Utilidad Neta | Margen %

#### 3. Modal desglose de Transportadora
**Referencia:** Pantallazo "INTERRAPIDISIMO" (minuto 5:49)
- [x] Al hacer clic en fila de transportadora → modal con:
  - [x] Header: nombre transportadora + Envíos Totales: X
  - [x] **Análisis de Entregas (N)**: Por Departamento | Por Ciudad | Por Producto (con % del total)
  - [x] **Análisis de Devoluciones (N)**: Por Departamento | Por Ciudad | Por Producto (con % del total)

### 🟡 Prioridad MEDIA

#### 4. Comparativa de Transportadoras (Gráfico de barras)
**Referencia:** Último pantallazo — gráfico de barras
- [ ] Gráfico de barras agrupadas por Departamento/Ciudad (Top 15)
- [ ] Filtros: Departamentos | Ciudades | % Efectividad | % Devolución
- [ ] Cada transportadora = una barra de color diferente
- [ ] Usar recharts (ya instalado en el proyecto)

#### 5. Filtro de estado en vista Tránsito Global
**Referencia:** Pantallazo Tránsito Global
- [ ] Dropdown "Filtrar estados" adicional en la vista de tránsito
- [ ] Permite filtrar por sub-estados (EN BODEGA TRANSPORTADORA, EN REPARTO, RECLAME EN OFICINA, etc.)

### 🟢 Prioridad BAJA

#### 6. Diario de Pauta (actualmente vacío)
- [ ] Calculadora proyectada: ingresas ventas esperadas, CPA objetivo, días de pauta
- [ ] Muestra proyección de gasto total, ROI esperado, utilidad proyectada

---

## 🎨 Colores de referencia por estado

| Estado | Color Header Modal | Badge Color |
|--------|--------------------|-------------|
| Pend. Confirmación | `#e67e22` naranja | `#f39c12` |
| Pendiente Envío | `#8e44ad` morado | `#9b59b6` |
| En Novedad | `#e67e22` naranja/amarillo | `#f39c12` |
| Reclamar en Oficina | `#8e44ad` morado | `#9b59b6` |
| Tránsito Total | `#2980b9` azul | `#3498db` |
| Entregados | `#27ae60` verde | `#2ecc71` |
| Devoluciones | `#c0392b` rojo | `#e74c3c` |
| Cancelados | `#7f8c8d` gris | `#95a5a6` |
| Rechazados | `#c0392b` rojo oscuro | `#e74c3c` |

---

## 📁 Archivos involucrados

- `src/components/LogisticsView.tsx` — Componente principal
- `src/lib/supabase.ts` — Cliente Supabase
- Tabla Supabase: `logistics_reports` (id, user_id, report_date, name, stats JSONB, raw_data JSONB)

---

## 🖼️ Pantallazos de referencia (LogisKei)

Los pantallazos están disponibles en la conversación de Antigravity:
- Dashboard principal con Finanzas Reales
- Modal Efectividad de Entrega (por transportadora + por producto)
- Modal Porcentaje en Tránsito
- Modal Tasa de Devolución  
- Vista Pend. Confirmación con valores por pedido
- Vista Novedades con badge de sub-estado
- Vista En Oficina (header morado)
- Vista Tránsito Global con filtro de sub-estados
- Vista Entregados con desglose financiero por pedido
- Vista Devoluciones
- Tabla Rentabilidad por Producto
- Modal desglose transportadora (por depto/ciudad/producto)
- Modal producto con inversión en publicidad
- Gráfico Comparativa de Transportadoras
