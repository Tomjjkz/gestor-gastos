import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import { UtensilsCrossed, Car, Home, Gamepad2, Lightbulb, ShoppingCart, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'

const CATEGORIAS = {
  Comida:      { color: '#F97316', Icono: UtensilsCrossed },
  Transporte:  { color: '#3B82F6', Icono: Car },
  Hogar:       { color: '#22C55E', Icono: Home },
  Ocio:        { color: '#A855F7', Icono: Gamepad2 },
  Servicios:   { color: '#FACC15', Icono: Lightbulb },
  Compras:     { color: '#EC4899', Icono: ShoppingCart },
}

function App() {
  
  const [gastos, setGastos] = useState([])
  const [fecha, setFecha] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Comida")
  const [modoEdicion, setModoEdicion] = useState(false)
  const [seleccionados, setSeleccionados] = useState([])
  const total = gastos.reduce((acumulado, gasto) => {
    return acumulado + Number(gasto.monto)
  }, 0)
  const [menuAbierto, setMenuAbierto] = useState(null)

  
  const agregarGasto = async () => {
    if (monto === "" || descripcion === "" || fecha === "") {
      return
    }
    const nuevoGasto =
      {
        monto: monto,
        categoria: categoria,
        fecha: fecha,
        descripcion: descripcion,
      }
      const { error } = await supabase.from('gastos').insert(nuevoGasto) 
      setGastos([...gastos, nuevoGasto])
      setMonto("")
      setFecha("")
      setDescripcion("")
      setCategoria("Comida")
    }
  useEffect(() => {
    const traerGastos = async () => {
      const { data, error } = await supabase.from('gastos').select('*')
      setGastos(data)
    }
    traerGastos()
  }, [])
  const borrarSeleccionados = async () => {
    const { error } = await supabase.from('gastos').delete().in('id', seleccionados)
    setGastos(gastos.filter((gasto) => !seleccionados.includes(gasto.id)))
    setSeleccionados([])
  }
  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    setGastos(gastos.filter((gasto) => gasto.id !== id))
    setMenuAbierto(null)
  }
  const duplicarGasto = async (gasto) => {
    const copia = {
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
    }
    const { data, error } = await supabase.from('gastos').insert(copia).select()
    setGastos([...gastos, data[0]])
    setMenuAbierto(null)
  }    
  useEffect(() => {
    if (menuAbierto === null) return
    const cerrarMenu = () => setMenuAbierto(null)
    document.addEventListener('click', cerrarMenu)
    return () => document.removeEventListener('click', cerrarMenu)
  }, [menuAbierto])
  

  return (
    <>
     <div className='seccion'>
      <h2>Nuevo gasto</h2>
      <form className='barra'>
        <input 
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {Object.keys(CATEGORIAS).map((nombre) => (
            <option key={nombre}>{nombre}</option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Descripcion del gasto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Ingrese el monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        <button type="button" onClick={agregarGasto}>Agregar gasto</button>
      </form>
     </div>

     <div className='seccion'>
        <p className='total'>Total gastado: -${total}</p>
        </div>
     <div className='seccion'>

      <h2>Gastos registrados</h2> 
      <button type="button" className='btn-editar' onClick={() => setModoEdicion(!modoEdicion)}>
        ✏️
      </button> 
      {seleccionados.length > 0 && (
        <button type='button' className='btn-borrar' onClick={borrarSeleccionados}>
          Borrar seleccionado/s
        </button>   
      )}
      <div className='encabezado'>
        <input type='checkbox' disabled style={{visibility: 'hidden'}} />
        <p>📅 Fecha</p>
        <p>🏷️ Categoría</p>
        <p>📝 Descripción</p>
        <p className='col-monto'>💰 Monto</p>
        <p></p>
      </div>    
      {gastos.map((gasto) => (
        <div key={gasto.id} 
        className='gasto'
        onMouseLeave={() => setMenuAbierto(null)}
        >
          <div className='celda-check'>
            {modoEdicion && (
              <input
                type="checkbox"
                checked={seleccionados.includes(gasto.id)}
                onChange={() => {
                  if (seleccionados.includes(gasto.id)) {
                    setSeleccionados(seleccionados.filter((id) => id !== gasto.id))
                  } else {
                    setSeleccionados([...seleccionados, gasto.id])
                  }
                }}
              />
            )}
          </div>
          <p>{gasto.fecha.split("-")[2]}/{gasto.fecha.split("-")[1]}/{gasto.fecha.split("-")[0]}</p>
          <div className='celda-categoria'>
            {(() => {
              const cat = CATEGORIAS[gasto.categoria]
              if (!cat) return <span className='badge badge-otros'>{gasto.categoria}</span>
              const Icono = cat.Icono
              return (
                <span
                  className='badge'
                  style={{ color: cat.color, background: `${cat.color}22`, borderColor: `${cat.color}55` }}
                >
                  <Icono size={14} />
                  {gasto.categoria}
                </span>
              )
            })()}
          </div>
          <p>{gasto.descripcion}</p>
          <p className='monto'>-${gasto.monto}</p>
          <div className='celda-acciones'>
            <button
              type='button'
              className='btn-menu'
              onClick={(e) => {
                e.stopPropagation() 
                setMenuAbierto(menuAbierto === gasto.id ? null : gasto.id)
              }}  
            >
              <MoreVertical size={16} />
            </button>
            {menuAbierto === gasto.id && (
              <div className='menu-contextual'>
                <button type='button' className='menu-item'>
                  <Pencil size={15} /> Editar
                </button>
                <button
                  type='button' 
                  className='menu-item'
                  onClick={() => duplicarGasto(gasto)}
                >  
                  <Copy size={15} /> Duplicar
                </button>
                <button 
                  type='button' 
                  className='menu-item menu-item-peligro'
                  onClick={() => eliminarGasto(gasto.id)}
                >  
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            )}
          </div> 
        </div>
      ))}
      </div>  
    </>
  )
}
export default App