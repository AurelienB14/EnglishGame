import { useRef } from 'react'

function PutGoal({ goal, setGoal, add, goalimg }) {    
    const debut = useRef(null)
    const debutTaille = useRef(null)

    const debutDeplacement = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    debut.current = { px: e.clientX, py: e.clientY, x: goal.x, y: goal.y }
    }

    const debutSize = (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    debutTaille.current = { px: e.clientX, w: goal.w}
    }

    const deplacement = (e) => {
    if (!debut.current) return
    setGoal({
        ...goal,
        x: debut.current.x + (e.clientX - debut.current.px),
        y: debut.current.y + (e.clientY - debut.current.py),
    })
    }

    const size = (e) => {
    if (!debutTaille.current) return
    setGoal({
        ...goal,
        w: Math.max(80, debutTaille.current.w + (e.clientX - debutTaille.current.px)),
    })
    }

    const finDeplacement = () => { debut.current = null }
    const finSize = () => { debutTaille.current = null }
    return (
        <>
        <div className="flex w-full h-full justify-center items-center">
            <div
                className="absolute touch-none"
                style={{ left: goal.x, top: goal.y, width: goal.w}}
                onPointerDown={debutDeplacement}
                onPointerMove={deplacement}
                onPointerUp={finDeplacement}
                >
                <img src={goalimg} alt="" draggable={false} className="w-full select-none touch-none" />
                <div className='absolute right-[-10px] bottom-[-10px] h-[20px] w-[20px] bg-[#FF0000] rounded-full'
                onPointerDown={debutSize}
                onPointerMove={size}
                onPointerUp={finSize}/>
            </div>
            <button onClick={add} className="absolute
            w-[200px] h-[50px] bottom-[50px] 
            bg-[#0B3B8F] text-[#FFFFFF]
            border-[2px] border-[#061A40] rounded-[50px]
            font-display uppercase tracking-wider text-[20px]
            ">Set Goal</button>
        </div>
        </>
    )
}

export default PutGoal
