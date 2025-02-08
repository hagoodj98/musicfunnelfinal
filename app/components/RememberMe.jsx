'use client';

import { useState } from "react"

const RememberMe = ({ onChange }) => {
    const [checked, setChecked]= useState(true);// default to "remember me" enabled

    const handleChange = (e) => {
        setChecked(e.target.checked);
        onChange(e.target.checked);
    };

    return (
        <div>
            <label><input type="checkbox" checked={checked} onChange={handleChange} />Remember me</label>
        </div>
  )
}

export default RememberMe;
