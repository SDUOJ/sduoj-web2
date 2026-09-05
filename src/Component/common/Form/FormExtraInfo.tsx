import { useEffect, useRef } from 'react';

const initial = Symbol('initial');

const FormExtraInfo = (props: any) => {
  const { eqs, onChange, setV, syncUndefined = false, v, value } = props;
  const previous = useRef<{ v: unknown; value: unknown }>({ v: initial, value: initial });
  const pending = useRef<{ form: unknown; local: unknown }>({ form: initial, local: initial });

  useEffect(() => {
    const wasInitial = previous.current.v === initial && previous.current.value === initial;
    let vChanged = previous.current.v === initial || !eqs(previous.current.v, v);
    let valueChanged = previous.current.value === initial || !eqs(previous.current.value, value);
    previous.current = { v, value };

    if (vChanged && pending.current.local !== initial && eqs(pending.current.local, v)) {
      pending.current.local = initial;
      vChanged = false;
    }
    if (valueChanged && pending.current.form !== initial && eqs(pending.current.form, value)) {
      pending.current.form = initial;
      valueChanged = false;
    }

    if (!vChanged && !valueChanged) return;
    if ((wasInitial && value !== undefined) || (!wasInitial && valueChanged)) {
      if (value === undefined && !syncUndefined) return;
      if (!eqs(value, v)) {
        pending.current.local = value;
        setV(value);
      }
      return;
    }
    if (v === undefined && !syncUndefined) return;
    if (!eqs(value, v)) {
      pending.current.form = v;
      onChange(v);
    }
  }, [eqs, onChange, setV, syncUndefined, v, value]);

  return null;
};

export default FormExtraInfo;
