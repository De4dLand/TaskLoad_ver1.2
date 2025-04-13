import { TextField } from "@mui/material"
import styles from "./InputField.module.css"

const InputField = ({ label, error = false, helperText = "", fullWidth = true, ...props }) => {
  return (
    <TextField
      label={label}
      variant="outlined"
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      className={styles.inputField}
      {...props}
    />
  )
}

export default InputField
