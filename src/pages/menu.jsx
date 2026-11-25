function Menu({text, buttonMenu, logoImg}) {
    return (
        <>
            <div className="flex w-full h-full justify-center items-center">
                <img src={logoImg} alt="" className="absolute w-[250px]"/>
                <button onClick={buttonMenu} className="absolute 
                w-[200px] h-[50px] bottom-[50px] 
                bg-[#0B3B8F] text-[#FFFFFF]
                border-[2px] border-[#061A40] rounded-[50px]
                font-display uppercase tracking-wider text-[20px]
                ">{text}</button>
            </div>
        </>
    )
}

export default Menu