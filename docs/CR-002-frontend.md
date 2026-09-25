# CR-002 — Presentación de producto (frontend)

## Cambio

El backend reemplazó `utilizaPack` / `cantidadPorPack` por:

```ts
presentacion: { cantidad: number; unidadMedida: string }
```

Reglas aplicadas en el frontend:

- `presentacion` es obligatoria al crear; en actualización se envía siempre completa.
- `cantidad`: decimal, mayor a 0, máximo 3 decimales y hasta `999999999,999` (coherente con `decimal(12,3)`).
- `unidadMedida`: texto libre obligatorio, no vacío ni solo espacios. Sin enum, catálogo, límite de largo, trim ni cambio de mayúsculas/minúsculas.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` | Nuevo `PresentacionProducto`; `Producto` y `ProductoSeleccionado` usan `presentacion` |
| `src/componentes/gestion-producto/producto/interfaces/interfaces-validaciones-producto.tsx` | `FormValues`, `schema`, `transformData`; nuevos `ProductoPayload` y `construirPayloadProducto` |
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Se quitan checkbox/input de pack; se agregan "Cantidad Presentación" y "Unidad de Medida" |
| `src/componentes/gestion-producto/producto/services/producto-service.tsx` | `createCrudService<ProductoPayload>` (antes tipado con el `FormValues` de ítem alternativo) |
| `src/componentes/herramientas/formateo-de-campos/double-input.tsx` | Prop opcional `decimalScale` (default 2, sin cambio de comportamiento) |
| `src/componentes/herramientas/reutilizables/producto/infor-producto-layout.tsx`, `.../seleccion-producto-con-porcentaje-presupuesto-venta.tsx` | Solo se reemplaza la visualización de pack por presentación (código muerto, ver deuda) |

El formulario usa campos planos (`presentacionCantidad`, `presentacionUnidadMedida`) porque los inputs compartidos
buscan el error con `errors[name]` y no soportan rutas anidadas. `construirPayloadProducto` arma el objeto
`presentacion` al enviar.

## Tests automatizados

Infraestructura: Vitest 3 + jsdom + React Testing Library (versiones compatibles con Node 20, igual que el `Dockerfile`).

```bash
yarn test        # corrida única
yarn test:watch  # modo watch
```

- `interfaces-validaciones-producto.test.ts`: schema (cantidades decimales válidas, cero/negativa/ausente,
  más de 3 decimales, máximo, unidad vacía/solo espacios, se conserva el texto ingresado, sin límite de largo,
  sin campos de pack), `transformData` y `construirPayloadProducto`.
- `registrar-actualizar-producto.test.tsx`: el formulario muestra los campos nuevos y no los de pack; no registra
  sin presentación; rechaza unidad con solo espacios; alta completa enviando `presentacion` con cantidad decimal;
  edición carga la presentación y la envía completa.

## Deuda técnica existente (fuera del alcance de CR-002)

1. **Errores de TypeScript preexistentes**: `tsc -p tsconfig.app.json --noEmit` reporta 122 errores
   (124 antes de CR-002; se corrigieron los 2 del payload de producto). `yarn build` usa `vite build`, que no chequea tipos.
2. **Resolver del formulario de producto** (`registrar-actualizar-producto.tsx`, `yupResolver(schema(...))`):
   el tipo inferido por yup no coincide con `FormValues`. Existía antes de CR-002.
3. **`KeyboardEvent<Element>` vs `KeyboardEvent<HTMLInputElement>`** en los selectores de línea/marca del mismo formulario.
4. **Campo `ubicacion`**: se renderiza en el formulario pero no está en `FormValues` ni en el schema; igual viaja en el payload.
5. **Subtítulo del formulario**: en edición dice "Sólo puede visualizarse, no modificarse" pero permite actualizar.
6. **Inputs compartidos** (`FormInput`, `CantidadesInput`, `DoubleInput`, `PriceInput`, `PorcentajeInput`) no muestran errores de campos anidados.
7. **`ConfiguracionSistemaContext`** usa siempre la configuración hardcodeada; muchos `console.log` en el formulario.
8. **`cambio-precios-masivo-service.tsx`** importa `../../producto/interfaces-validaciones-producto`, que no existe.
9. **Código muerto** (sin eliminar a pedido; sin referencias desde rutas vivas):

| Archivo | Referencias verificadas |
|---|---|
| `producto/componentes/configuracion/presentacion-selector.tsx` | 0 importadores; modela presentación como entidad (`id`/`denominacion`, `presentacionId`) |
| `interfaces/gestion-producto/presentacion/interfaces-presentacion.tsx` | Solo lo importa `presentacion-selector.tsx` |
| `interfaces/gestion-producto/unidad-medida/interfaces-unidad-medida.tsx` | 0 importadores; modela unidad como catálogo |
| `SelectPresentacion` en `interfaces-producto.tsx` | 0 usos (duplicado del de `interfaces-presentacion.tsx`) |
| `herramientas/reutilizables/producto/infor-producto-layout.tsx` | Solo desde el archivo siguiente; importa `context/factura-venta-context` (inexistente) |
| `herramientas/reutilizables/seleccion-producto-con-porcentaje-presupuesto-venta.tsx` | 0 importadores; importa módulos inexistentes |
| `herramientas/reutilizables/seleccion-producto.tsx`, `busqueda-producto.tsx` | Solo desde la cadena muerta anterior |

El flag `configuracion.unidadMedida` no se lee en ningún lado; se mantiene por ser configuración de sistema.
