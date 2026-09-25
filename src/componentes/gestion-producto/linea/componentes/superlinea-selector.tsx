import Select from "react-select";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@radix-ui/react-label";
import { SelectSuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

// CR-003: selector de SuperLínea del formulario de Línea. "Sin SuperLínea" guarda null.
const OPCION_SIN_SUPERLINEA: SelectSuperLinea = { id: 0, denominacion: "Sin SuperLínea" };

interface Props {
  superLineas: SelectSuperLinea[];
  loading?: boolean;
  disabled?: boolean;
}

export function SuperLineaSelector({ superLineas, loading = false, disabled = false }: Props) {
  const { control } = useFormContext();
  const opciones = [OPCION_SIN_SUPERLINEA, ...superLineas];

  return (
    <div className="space-y-1 sm:space-y-2">
      <Label htmlFor="superLineaId" className="label-base">
        SuperLínea
      </Label>
      <Controller
        name="superLineaId"
        control={control}
        render={({ field }) => (
          <Select
            inputId="superLineaId"
            value={opciones.find((o) => o.id === (field.value ?? 0)) ?? OPCION_SIN_SUPERLINEA}
            options={opciones}
            getOptionLabel={(o) => o.denominacion}
            getOptionValue={(o) => String(o.id)}
            onChange={(opt) => field.onChange(opt && opt.id > 0 ? opt.id : null)}
            onBlur={field.onBlur}
            isDisabled={disabled}
            isLoading={loading}
            noOptionsMessage={() => "No hay SuperLíneas"}
            menuPortalTarget={document.body}
            styles={selectStyles}
          />
        )}
      />
    </div>
  );
}

const selectStyles = {
  control: (base: any) => ({ ...base, color: "black" }),
  singleValue: (base: any) => ({ ...base, color: "black" }),
  option: (base: any, state: any) => ({
    ...base,
    color: state.isSelected ? "white" : "black",
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#93c5fd" : "white",
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};
