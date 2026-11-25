import Button from '../component/button'

// Affiché par-dessus la page en cours (qui reste montée, donc rien n'est perdu)
function Menu({ text, onPress, logoImg }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-navy/70">
      <img src={logoImg} alt="Green Pitch" className="w-[250px]" />
      <Button onClick={onPress} className="absolute bottom-12 w-52">
        {text}
      </Button>
    </div>
  )
}

export default Menu
