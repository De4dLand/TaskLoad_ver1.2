import { Button as MuiButton } from "@mui/material"
import styles from "./Button.module.css"

const Button = ({ children, variant = "contained", color = "primary", ...props }) => {
  return (
    <MuiButton variant={variant} color={color} className={styles.button} {...props}>
      {children}
    </MuiButton>
  )
}

export default Button
