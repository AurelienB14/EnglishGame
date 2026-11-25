// Bouton de la charte : pilule dorée, texte navy
const SIZES = {
  lg: 'h-14 px-2 text-xl',
  sm: 'h-10 px-4 text-sm',
}

function Button({ size = 'lg', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full bg-gold font-condensed font-bold uppercase tracking-brand text-navy disabled:opacity-40 ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}

export default Button
