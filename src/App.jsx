import { useState, useEffect, useRef } from 'react'
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
const fechaDeHoy = () => new Date().toISOString().split('T')[0]

function App() {
  const filasRefs = useRef({})
  const [toastSaliendo, setToastSaliendo] = useState(false)
  const toastHideRef = useRef(null)
  const [idsSaliendo, setIdsSaliendo] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [fechaEdit, setFechaEdit] = useState("")
  const [categoriaEdit, setCategoriaEdit] = useState("Comida")
  const [montoEdit, setMontoEdit] = useState("")
  const [descripcionEdit, setDescripcionEdit] = useState("")
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastos, setGastos] = useState([])
  const [fecha, setFecha] = useState(fechaDeHoy)
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Comida")
  const [seleccionados, setSeleccionados] = useState([])
  const total = gastos.reduce((acumulado, gasto) => {
    return acumulado + Number(gasto.monto)
  }, 0)
  const [menuAbierto, setMenuAbierto] = useState(null)

  const iniciarSalidaFila = (id) => {
    const el = filasRefs.current[id]
    if (!el) return

    el.style.height = `${el.scrollHeight}px`
    el.offsetHeight

    requestAnimationFrame(() => {
      el.style.height = '0px'
      el.style.marginTop = '0px'
      el.style.marginBottom = '0px'
    })
  }

  const cerrarToast = () => {
    clearTimeout(toastTimeoutRef.current)
    clearTimeout(toastHideRef.current)
    setToastSaliendo(true)
    toastHideRef.current = setTimeout(() => {
      setToast(null)
      setToastSaliendo(false)
    }, 250)
  }

  const deshacerEliminar = async () => {
    if (!toast) return

    const copias = toast.gastosEliminados.map((gasto) => ({
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
    }))

    const { data, error } = await supabase.from('gastos').insert(copias).select()
    setGastos((prev) => [...prev, ...data])

    cerrarToast()
  }

  const mostrarToast = (mensaje, gastosEliminados) => {
    clearTimeout(toastTimeoutRef.current)
    clearTimeout(toastHideRef.current)
    setToastSaliendo(false)
    setToast({ mensaje, gastosEliminados })
    toastTimeoutRef.current = setTimeout(cerrarToast, 3000)
  }

  const confirmarBorrado = () => {
    if (confirmarEliminar.tipo === 'individual') {
      const gasto = confirmarEliminar.gasto
      setConfirmarEliminar(null)
      iniciarSalidaFila(gasto.id)
      setIdsSaliendo((prev) => [...prev, gasto.id])

      setTimeout(async () => {
        await eliminarGasto(gasto.id)
        setIdsSaliendo((prev) => prev.filter((id) => id !== gasto.id))
        mostrarToast('Gasto eliminado correctamente', [gasto])
      }, 300)
    } else {
      const idsABorrar = seleccionados
      const gastosABorrar = gastos.filter((gasto) => idsABorrar.includes(gasto.id))
      setConfirmarEliminar(null)
      idsABorrar.forEach((id) => iniciarSalidaFila(id))
      setIdsSaliendo((prev) => [...prev, ...idsABorrar])

      setTimeout(async () => {
        await borrarSeleccionados()
        setIdsSaliendo((prev) => prev.filter((id) => !idsABorrar.includes(id)))
        mostrarToast(
          `${gastosABorrar.length} gasto${gastosABorrar.length > 1 ? 's' : ''} eliminado${gastosABorrar.length > 1 ? 's' : ''} correctamente`,
          gastosABorrar
        )
      }, 300)
    }
  }

  const guardarEdicion = async () => {
    const { error } = await supabase
      .from('gastos')
      .update({
        fecha: fechaEdit,
        categoria: categoriaEdit,
        descripcion: descripcionEdit,
        monto: montoEdit,
      })
      .eq('id', gastoEditando.id)

    setGastos(gastos.map((gasto) =>
      gasto.id === gastoEditando.id
        ? { ...gasto, fecha: fechaEdit, categoria: categoriaEdit, descripcion: descripcionEdit, monto: montoEdit }
        : gasto
    ))
    setGastoEditando(null)
  }

  const agregarGasto = async () => {
    if (monto === "" || descripcion === "" || fecha === "") {
      return
    }
    const nuevoGasto = {
      monto: monto,
      categoria: categoria,
      fecha: fecha,
      descripcion: descripcion,
    }
    const { error } = await supabase.from('gastos').insert(nuevoGasto)
    setGastos([...gastos, nuevoGasto])
    setMonto("")
    setFecha(fechaDeHoy())
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

  useEffect(() => {
    if (gastoEditando) {
      setFechaEdit(gastoEditando.fecha)
      setCategoriaEdit(gastoEditando.categoria)
      setDescripcionEdit(gastoEditando.descripcion)
      setMontoEdit(gastoEditando.monto)
    }
  }, [gastoEditando])

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
        <div className={`tabla-gastos ${seleccionados.length > 0 ? 'hay-seleccion' : ''}`}>

          <div className='encabezado'>
            <input type='checkbox' disabled style={{ visibility: 'hidden' }} />
            <p>📅 Fecha</p>
            <p>🏷️ Categoría</p>
            <p>📝 Descripción</p>
            <p className='col-monto'>💰 Monto</p>
            <p></p>
          </div>
          {gastos.map((gasto) => (
            <div
              key={gasto.id}
              ref={(el) => { filasRefs.current[gasto.id] = el }}
              className={`fila-wrapper ${idsSaliendo.includes(gasto.id) ? 'saliendo' : ''}`}
            >
              <div
                className='gasto'
                onMouseLeave={() => setMenuAbierto(null)}
                onDoubleClick={() => setGastoEditando(gasto)}
              >
                <div className='celda-check'>
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
                      <button
                        type='button'
                        className='menu-item'
                        onClick={() => { setGastoEditando(gasto); setMenuAbierto(null) }}
                      >
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
                        onClick={() => { setConfirmarEliminar({ tipo: 'individual', gasto }); setMenuAbierto(null) }}
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {seleccionados.length > 0 && (
            <div className='acciones-tabla-abajo'>
              <button type='button' className='btn-eliminar-seleccionados' onClick={() => setConfirmarEliminar({ tipo: 'multiple' })}>
                <Trash2 size={15} /> Eliminar seleccionados
              </button>
            </div>
          )}
        </div>
      </div>

      {gastoEditando && (
        <div className='modal-overlay' onClick={() => setGastoEditando(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <h2>Editar gasto</h2>
            <div className='modal-campo'>
              <label>Fecha</label>
              <input
                type="date"
                value={fechaEdit}
                onChange={(e) => setFechaEdit(e.target.value)}
              />
            </div>
            <div className='modal-campo'>
              <label>Categoria</label>
              <select value={categoriaEdit} onChange={(e) => setCategoriaEdit(e.target.value)}>
                {Object.keys(CATEGORIAS).map((nombre) => (
                  <option key={nombre}>{nombre}</option>
                ))}
              </select>
            </div>
            <div className='modal-campo'>
              <label>Descripción</label>
              <input
                type="text"
                value={descripcionEdit}
                onChange={(e) => setDescripcionEdit(e.target.value)}
              />
            </div>
            <div className='modal-campo'>
              <label>Monto</label>
              <input
                type="number"
                value={montoEdit}
                onChange={(e) => setMontoEdit(e.target.value)}
              />
            </div>
            <div className='modal-acciones'>
              <button type='button' className='btn-cancelar' onClick={() => setGastoEditando(null)}>
                Cancelar
              </button>
              <button type='button' className='btn-guardar' onClick={guardarEdicion}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className='modal-overlay' onClick={() => setConfirmarEliminar(null)}>
          <div className='modal modal-confirmacion' onClick={(e) => e.stopPropagation()}>
            <h2>
              {confirmarEliminar.tipo === 'individual' ? '¿Eliminar este gasto?' : '¿Eliminar los gastos seleccionados?'}
            </h2>
            <p className='modal-confirmacion-texto'>
              {confirmarEliminar.tipo === 'individual'
                ? `¿Seguro que querés eliminar "${confirmarEliminar.gasto.descripcion}"? Esta acción no puede deshacerse.`
                : `¿Seguro que querés eliminar ${seleccionados.length} gasto${seleccionados.length > 1 ? 's' : ''}? Esta acción no puede deshacerse.`}
            </p>
            <div className='modal-acciones'>
              <button type='button' className='btn-cancelar' onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button type='button' className='btn-eliminar-confirmar' onClick={confirmarBorrado}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toastSaliendo ? 'toast-saliendo' : ''}`}>
          <span>✔ {toast.mensaje}</span>
          <button type='button' className='toast-deshacer' onClick={deshacerEliminar}>
            Deshacer
          </button>
        </div>
      )}
    </>
  )
}
export default App