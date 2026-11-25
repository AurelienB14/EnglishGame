import Button from '../component/button'

// Affiché par-dessus la page en cours (qui reste montée, donc rien n'est perdu)
function Menu({ text, onPress, logoImg }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-12 bg-navy/70 pb-6"
    >
      {/* Notre logo est foncé : on le pose sur un panneau clair (jamais recoloré ni ombré) */}
      <div className="panel p-white p-5">
        <img src={logoImg} alt="Green Pitch" className="w-[210px]" />
      </div>
      <Button autoFocus onClick={onPress} className="w-[220px]">
        {text}
      </Button>
    </div>
  )
}

export default Menu
