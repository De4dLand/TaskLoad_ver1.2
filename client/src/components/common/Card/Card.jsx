import { Card as MuiCard, CardContent } from "@mui/material"
import styles from "./Card.module.css"

const Card = ({ children, className = "", ...props }) => {
  return (
    <MuiCard className={`${styles.card} ${className}`} {...props}>
      <CardContent>{children}</CardContent>
    </MuiCard>
  )
}

export default Card
