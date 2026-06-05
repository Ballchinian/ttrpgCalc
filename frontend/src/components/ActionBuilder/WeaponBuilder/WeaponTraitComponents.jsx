import FormField from "../../utility/FormField";

export default function TraitFieldRenderer({ fields, value, setValue, errors }) {
    return fields.map(field => (
        <FormField
            key={field.key}
            field={field}
            value={value?.[field.key]}
            onChange={v => setValue({ ...value, [field.key]: v })}
            error={errors?.[field.key]}
        />
    ));
}
