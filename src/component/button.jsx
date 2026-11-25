// Bouton de la charte : pilule dorée, texte navy, ombre pleine (styles .btn dans index.css)
// size : 'lg' (56 px) ou 'sm' (40 px) · variant : 'gold' ou 'navy' · wide : prend toute la largeur de sa case
function Button({ size = 'lg', variant = 'gold', wide = false, className = '', ...props }) {
  const classes = [
    'btn',
    size === 'lg' ? 'btn-lg' : 'btn-sm',
    variant === 'navy' && 'btn-navy',
    wide && 'btn-wide',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type="button" className={classes} {...props} />
}

export default Button
