// Étoile partagée (niveaux, bouton bonus). Les couleurs viennent de className (fill-*, stroke-*).
function Star({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Star
