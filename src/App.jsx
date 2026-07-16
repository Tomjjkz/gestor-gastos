import { useState } from 'react'
import './App.css'

function App() {
  const agregarGasto = () => {
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
      setGastos([...gastos, nuevoGasto])
      setMonto("")
      setFecha("")
      setDescripcion("")
      setCategoria("Comida")
      console.log(nuevoGasto)
    }
  const [gastos, setGastos] = useState([])
  const [fecha, setFecha] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Comida")
  const total = gastos.reduce((acumulado, gasto) => {
    return acumulado + Number(gasto.monto)
  }, 0)

  return (
    <>
      <form className='barra'>
        <input 
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option>Comida</option>
          <option>Transporte</option>
          <option>Entretenimiento</option>
          <option>Servicios</option>
          <option>Salud</option>
          <option>Otros</option>
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
      {gastos.map((gasto, index) => (
        <div key={index} className='gasto'>
          <p>{gasto.fecha.split("-")[2]}/{gasto.fecha.split("-")[1]}/{gasto.fecha.split("-")[0]}</p>
          <p>{gasto.categoria}</p>
          <p>{gasto.descripcion}</p>
          <p className='monto'>-${gasto.monto}</p>
        </div>
        ))}
        <div className='resumen'>
        <p className='total'>Total gastado: -${total}</p>
        </div>
      <div className="ticks"></div>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App

  