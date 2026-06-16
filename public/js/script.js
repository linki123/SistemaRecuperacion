const API = "";
const equivalencia = {
    AD: 4,
    A: 3,
    B: 2,
    C: 0
};
/* =====================================================
   🧠 SISTEMA GENERAL - COLEGIOS / DIAGNÓSTICO / RECUPERACIÓN
===================================================== */

let colegiosCache = [];

/* =====================================================
   📊 DIAGNÓSTICO
===================================================== */

/* Calcular diagnóstico (tabla) */
function calcularDiagnostico(items, equivalencia) {

    let total = 0;

    const notas = document.querySelectorAll(".nota");
    const puntajes = document.querySelectorAll(".puntaje");

    notas.forEach((n, i) => {

        let val = equivalencia[n.value];
        puntajes[i].innerText = val;
        total += val;
    });

    const max = items.length * 4;
    const porcentaje = ((total / max) * 100).toFixed(1);

    let nivel = "Crítico";

    if (porcentaje >= 90) nivel = "Excelente";
    else if (porcentaje >= 75) nivel = "Bueno";
    else if (porcentaje >= 50) nivel = "Regular";

    return { total, max, porcentaje, nivel };
}

/* Guardar diagnóstico */
async function guardarDiagnosticoSistema() {

    const detalles = [];

    document
    .querySelectorAll("#tablaEvaluacion tr")
    .forEach((fila, index) => {

        const nota =
            fila.querySelector(".nota").value;

        detalles.push({
            criterio_id: index + 1,
            calificacion: nota,
            puntaje: equivalencia[nota]
        });

    });

    const data = {

        colegio:
            document.getElementById("colegio").value,

        asesor:
            document.getElementById("asesor").value,

        fecha:
            document.getElementById("fecha").value,

        total:
            document.getElementById("totalPuntaje").innerText,

        porcentaje:
            document.getElementById("porcentaje").innerText,

        nivel:
            document.getElementById("nivel").innerText,

        detalles

    };

    console.log("Enviando diagnóstico:");
    console.log(data);

    try {

        const resultado =
            await guardarDiagnostico(data);

        console.log("Respuesta servidor:");
        console.log(resultado);

        if (resultado?.ok) {

            alert(
                "Diagnóstico guardado correctamente. ID: " +
                resultado.diagnostico_id
            );

        } else {

            alert(
                "Error guardando diagnóstico"
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "Error de conexión con el servidor"
        );

    }

}


async function guardarDiagnostico(data) {

    const res = await fetch(`${API}/diagnostico`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await res.json();
}

/* =====================================================
   🚀 RECUPERACIÓN
===================================================== */

/* calcular porcentaje de una inducción */
function calcInduccion(clase) {

    const items = document.querySelectorAll("." + clase);
    let count = 0;

    items.forEach(i => {
        if (i.checked) count++;
    });

    if (items.length === 0) return 0;

    return (count / items.length) * 100;
}

/* actualizar progreso recuperación */
function actualizarRecuperacion() {

    let p1 = calcInduccion("i1");
    let p2 = calcInduccion("i2");
    let p3 = calcInduccion("i3");
    let p4 = calcInduccion("i4");

    document.getElementById("p1").innerText = Math.round(p1) + "%";
    document.getElementById("p2").innerText = Math.round(p2) + "%";
    document.getElementById("pg").innerText = Math.round((p1 + p2 + p3 + p4) / 4) + "%";

    /* barra visual */
    const bar1 = document.getElementById("bar1");
    if (bar1) bar1.style.width = p1 + "%";

    /* desbloqueos */
    if (p1 === 100) {
        document.getElementById("ind2")?.classList.remove("locked");
    }

    if (p2 === 100) {
        document.getElementById("ind3")?.classList.remove("locked");
    }

    if (p3 === 100) {
        document.getElementById("ind4")?.classList.remove("locked");
    }

    return { p1, p2, p3, p4 };
}

/* guardar recuperación */
async function guardarRecuperacion(data) {

    try {

        const res = await fetch(`${API}/induccion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        return await res.json();

    } catch (err) {
        console.error("Error guardando recuperación:", err);
    }
}

/* =====================================================
   🏫 COLEGIOS POR ASESOR
===================================================== */

async function cargarColegiosPorAsesor(asesorId, selectId) {

    const select = document.getElementById(selectId);

    if (!select) return;

    try {

        const res = await fetch(`${API}/colegios/${asesorId}`);
        const data = await res.json();

        colegiosCache = data;

        select.innerHTML = "";

        data.forEach(c => {

            const opt = document.createElement("option");

            opt.value = c.id;
            opt.innerText = c.nombre;

            select.appendChild(opt);

        });

        const guardado =
            localStorage.getItem("colegioSeleccionado");

        if (guardado) {

            const existe =
                data.find(c => c.id == guardado);

            if (existe) {
                select.value = guardado;
            }

        }

        mostrarUrlColegio();

        if (typeof cargarPlan === "function") {
            await cargarPlan();
        }

    } catch (err) {

        console.error(
            "Error cargando colegios:",
            err
        );

    }

}

/* =====================================================
   📈 PROGRESO COLEGIO
===================================================== */

async function obtenerProgreso(colegioId) {

    try {

        const res = await fetch(`${API}/progreso/${colegioId}`);
        return await res.json();

    } catch (err) {
        console.error("Error obteniendo progreso:", err);
    }
}

/* =====================================================
   🧠 UTILIDAD GLOBAL
===================================================== */

function mostrarNivel(porcentaje) {

    if (porcentaje >= 90) return "Excelente";
    if (porcentaje >= 75) return "Bueno";
    if (porcentaje >= 50) return "Regular";
    return "Crítico";
}

/* =========================
   👤 CARGAR ASESORES
========================= */

async function cargarAsesores(selectId) {

    const select = document.getElementById(selectId);

    if (!select) return;

    try {

        const res = await fetch(`${API}/asesores`);
        const asesores = await res.json();

        select.innerHTML = "";

        asesores.forEach(a => {

            const opt = document.createElement("option");

            opt.value = a.id;
            opt.textContent = a.nombre;

            select.appendChild(opt);

        });

    } catch (err) {

        console.error("Error cargando asesores:", err);

    }

}

function mostrarUrlColegio() {

    const inputUrl =
        document.getElementById("urlColegio");

    if (!inputUrl) return;

    const colegioId =
        Number(document.getElementById("colegio").value);

    const colegio =
        colegiosCache.find(c => c.id === colegioId);

    inputUrl.value =
        colegio ? colegio.url : "";
}

document.addEventListener("DOMContentLoaded", () => {

    const colegio = document.getElementById("colegio");

    if (colegio) {

        colegio.addEventListener("change", () => {

            localStorage.setItem(
                "colegioSeleccionado",
                colegio.value
            );

        });

    }

});

async function cargarDiagnosticoColegio(colegioId) {

    try {

        const res = await fetch(
            `${API}/diagnostico/colegio/${colegioId}`
        );

        const data = await res.json();

        const notas =
            document.querySelectorAll(".nota");

        if (!data.existe) {

            notas.forEach(n => {
                n.value = "C";
            });

            actualizarUI();

            return;
        }

        data.detalles.forEach((d, index) => {

            if (notas[index]) {

                notas[index].value =
                    d.calificacion;

            }

        });

        actualizarUI();

    } catch (err) {

        console.error(
            "Error cargando diagnóstico:",
            err
        );

    }

}


async function cargarHistorial() {

    const colegioId =
        document.getElementById(
            "colegio"
        ).value;

    if (!colegioId) return;

    const res =
        await fetch(
            `${API}/diagnosticos/colegio/${colegioId}`
        );

    const datos =
        await res.json();

    const tbody =
        document.getElementById(
            "tablaHistorial"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    datos.forEach(d => {

        tbody.innerHTML += `
            <tr>

                <td>${d.id}</td>

                <td>
                    ${d.fecha.split("T")[0]}
                </td>

                <td>
                    ${d.porcentaje}%
                </td>

                <td>
                    ${d.nivel}
                </td>

                <td>

                    <button
                        onclick="
                        verDiagnostico(
                            ${d.id}
                        )">

                        👁

                    </button>

                </td>

            </tr>
        `;

    });

    await cargarHistorico();

}

async function verDiagnostico(id) {

    const res =
        await fetch(
            `${API}/diagnostico/${id}`
        );

    const datos =
        await res.json();

    const tbody =
        document.getElementById(
            "detalleDiagnostico"
        );

    tbody.innerHTML = "";

    datos.forEach(item => {

        tbody.innerHTML += `
            <tr>

                <td>${item.modulo}</td>

                <td>${item.descripcion}</td>

                <td>${item.calificacion}</td>

            </tr>
        `;

    });

    const cambiosBody =
        document.getElementById(
            "tablaCambios"
        );

    cambiosBody.innerHTML = "";

    const anteriorRes =
        await fetch(
            `${API}/diagnostico-anterior/${id}`
        );

    const anterior =
        await anteriorRes.json();

    if (anterior) {

        const compararRes =
            await fetch(
                `${API}/comparar/${id}/${anterior.id}`
            );

        const cambios =
            await compararRes.json();

        cambios.forEach(cambio => {

    let impactoTexto = cambio.impacto;
    let icono = "";

    if (cambio.impacto > 0) {

        icono = "⬆";
        impactoTexto = "+" + cambio.impacto;

    }
    else if (cambio.impacto < 0) {

        icono = "⬇";

    }

    cambiosBody.innerHTML += `
        <tr>

            <td>
                ${cambio.descripcion}
            </td>

            <td>
                ${cambio.antes}
            </td>

            <td>
                ${cambio.despues}
            </td>

            <td>
                ${icono} ${impactoTexto}
            </td>

        </tr>
    `;

});

    } else {

        cambiosBody.innerHTML = `
            <tr>

                <td colspan="3">

                    No existe una revisión anterior

                </td>

            </tr>
        `;

    }

    document
        .getElementById(
            "modalDiagnostico"
        )
        .style.display = "block";

}


let graficoHistorico = null;

async function cargarHistorico() {

    const colegio =
        document.getElementById("colegio").value;

    const res =
        await fetch(
            `${API}/historico/${colegio}`
        );

    const datos =
        await res.json();

    const labels =
        datos.map(x =>
            x.fecha.substring(0,10)
        );

    const porcentajes =
        datos.map(x =>
            Number(x.porcentaje)
        );

    const ctx =
        document
        .getElementById("graficoHistorico")
        .getContext("2d");

    if(graficoHistorico){

        graficoHistorico.destroy();

    }

    graficoHistorico =
        new Chart(ctx,{

            type:"line",

            data:{

                labels,

                datasets:[{

                    label:
                    "Porcentaje diagnóstico",

                    data:
                    porcentajes,

                    tension:0.3

                }]

            }

        });

}

async function obtenerPlanRecuperacion(){

    const colegio =
        document.getElementById(
            "colegio"
        ).value;

    const asesor =
        document.getElementById(
            "asesor"
        ).value;

    const res =
        await fetch(
            `${API}/plan/${colegio}/${asesor}`
        );

    return await res.json();
}



async function obtenerInducciones() {

    const res = await fetch(`${API}/inducciones`);
    return await res.json();

}

async function cargarInducciones() {

    const inducciones =
        await obtenerInducciones();

    const linea =
        document.getElementById(
            "lineaInducciones"
        );

    if (!linea) return;

    linea.innerHTML = "";

    inducciones.forEach(i => {

        linea.innerHTML += `
            <button
                class="btn"
                onclick="
                    seleccionarInduccion(
                        ${i.id},
                        '${i.nombre}'
                    )
                ">

                ${i.id}. ${i.nombre}

            </button>
        `;

    });

    if (inducciones.length > 0) {

        await seleccionarInduccion(
            inducciones[0].id,
            inducciones[0].nombre
        );

    }

}



async function cargarResumenInducciones() {

    if (!planActualId) return;

    const res =
        await fetch(
            `${API}/plan/${planActualId}/resumen-inducciones`
        );

    const resumen =
        await res.json();

    const linea =
        document.getElementById(
            "lineaInducciones"
        );

    if (!linea) return;

    linea.innerHTML = "";

    resumen.forEach(i => {

        let clase = "ind-rojo";
let estado = "Crítico";

if (Number(i.porcentaje) >= 75) {
    clase = "ind-verde";
    estado = "Bueno";
}
else if (Number(i.porcentaje) >= 50) {
    clase = "ind-amarillo";
    estado = "Regular";
}

linea.innerHTML += `
    <button
        class="btn-induccion ${clase}"
        onclick="
            seleccionarInduccion(
                ${i.induccion_id},
                '${i.nombre}'
            )
        ">

        <div class="ind-titulo">
            ${i.induccion_id}. ${i.nombre}
        </div>

        <div class="ind-porcentaje">
            ${i.porcentaje}%
        </div>

        <div class="ind-estado">
            ${estado}
        </div>

    </button>
`;

    });


let suma = 0;
let completadas = 0;
let proceso = 0;
let pendientes = 0;

resumen.forEach(i => {

    const p = Number(i.porcentaje);

    suma += p;

    if (p >= 100) {
        completadas++;
    }
    else if (p > 0) {
        proceso++;
    }
    else {
        pendientes++;
    }

});

const general =
    resumen.length === 0
        ? 0
        : Math.round(suma / resumen.length);

document.getElementById("pg").innerText =
    general + "%";

document.getElementById("induccionesCompletadas").innerText =
    completadas + " de " + resumen.length;

document.getElementById("induccionesProceso").innerText =
    proceso;

document.getElementById("induccionesPendientes").innerText =
    pendientes;

const barra =
    document.getElementById("barraProgresoGeneral");

if (barra) {
    barra.style.width = general + "%";
}


}



async function seleccionarInduccion(id, nombre) {

    induccionActualId = id;

    const titulo =
        document.getElementById(
            "tituloInduccion"
        );

    if (titulo) {
        titulo.innerText =
            `Inducción ${id} - ${nombre}`;
    }

    const res =
        await fetch(
            `${API}/tareas-induccion/${id}`
        );

    const tareas =
        await res.json();

    const contenedor =
        document.getElementById(
            "detalleInduccion"
        );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    tareas.forEach(t => {

        contenedor.innerHTML += `
            <label class="check">
                <input
                    type="checkbox"
                    data-tarea-id="${t.id}"
                    data-induccion-id="${id}"
                    onchange="actualizarProgresoPlan()">
                ${t.descripcion}
            </label>
        `;

    });

    if (planActualId) {

    await cargarTareasGuardadas(
        planActualId
    );

    await cargarEvidenciaInduccion();

}

}






async function cargarEvidenciaInduccion() {


    if (!planActualId || !induccionActualId) {
        return;
    }


    const res =
        await fetch(
            `${API}/plan/${planActualId}/induccion/${induccionActualId}/evidencia`
        );


    const data =
        await res.json();



    document.getElementById("evResponsable").value =
        data?.responsable || "";


    document.getElementById("evHelpdesk").value =
        data?.helpdesk || "";


    document.getElementById("evCaptura").value =
        data?.captura_url || "";


    document.getElementById("evGrabacion").value =
        data?.grabacion_url || "";


    document.getElementById("evAcuerdos").value =
        data?.acuerdos || "";


    document.getElementById("evProximaAccion").value =
        data?.proxima_accion || "";


    document.getElementById("evProximaFecha").value =
        data?.proxima_fecha
        ? data.proxima_fecha.split("T")[0]
        : "";


}







async function guardarInduccionActual() {

    if (!planActualId) {
        await cargarPlan();
    }

    const checks =
        document.querySelectorAll(
            `input[data-induccion-id="${induccionActualId}"]`
        );

    const tareas =
        Array.from(checks)
        .map(chk => ({
            tarea_id:
                Number(chk.dataset.tareaId),
            completado:
                chk.checked ? 1 : 0
        }));

    const res =
        await fetch(
            `${API}/plan/${planActualId}/tareas`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    tareas
                })
            }
        );

    const result =
        await res.json();

    if (result.ok) {


    await guardarEvidenciaInduccion();


    alert(
        "Inducción guardada correctamente"
    );

        await cargarResumenInducciones();

await seleccionarInduccion(
    induccionActualId,
    document
        .getElementById("tituloInduccion")
        .innerText
        .replace(`Inducción ${induccionActualId} - `, "")
);

    } else {

        alert(
            "Error guardando inducción"
        );

    }

}


async function guardarEvidenciaInduccion() {


    const evidencia = {


        responsable:
            document.getElementById(
                "evResponsable"
            ).value,


        helpdesk:
            document.getElementById(
                "evHelpdesk"
            ).value,


        captura_url:
            document.getElementById(
                "evCaptura"
            ).value,


        grabacion_url:
            document.getElementById(
                "evGrabacion"
            ).value,


        acuerdos:
            document.getElementById(
                "evAcuerdos"
            ).value,


        proxima_accion:
            document.getElementById(
                "evProximaAccion"
            ).value,


        proxima_fecha:
            document.getElementById(
                "evProximaFecha"
            ).value


    };



    await fetch(
        `${API}/plan/${planActualId}/induccion/${induccionActualId}/evidencia`,
        {

            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:
                JSON.stringify(evidencia)

        }
    );


}



async function cargarTareasInduccion(induccionId) {

    const res =
        await fetch(
            `${API}/tareas-induccion/${induccionId}`
        );

    const tareas =
        await res.json();

    const contenedor =
        document.getElementById(
            `tareas-${induccionId}`
        );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    tareas.forEach(t => {

        contenedor.innerHTML += `
            <label class="check">
                <input 
                    type="checkbox"
                    data-tarea-id="${t.id}"
                    data-induccion-id="${induccionId}"
                    onchange="actualizarProgresoPlan()">
                ${t.descripcion}
            </label>
        `;

    });

}

//al cambiar de colegio limpie y cargue sus checks propios


let planActualId = null;
let induccionActualId = null;
async function cargarPlan() {

    const plan =
        await obtenerPlanRecuperacion();

    planActualId = plan.id;

    console.log("Plan actual:", plan);

    await cargarResumenInducciones();

    await seleccionarInduccion(
        1,
        "Web y Data"
    );

}

async function cargarTareasGuardadas(planId) {

    const checks =
        document.querySelectorAll(
            "input[data-tarea-id]"
        );

    checks.forEach(chk => {
        chk.checked = false;
    });

    const res =
        await fetch(
            `${API}/plan/${planId}/tareas`
        );

    const tareas =
        await res.json();

    let ultimaFecha = null;

    tareas.forEach(t => {

        const chk =
            document.querySelector(
                `input[data-tarea-id="${t.tarea_id}"]`
            );

        if (chk) {

            chk.checked =
                t.completado == 1 ||
                t.completado === true;

        }

        if (t.fecha_actualizacion) {

            const fecha =
                new Date(t.fecha_actualizacion);

            if (!ultimaFecha || fecha > ultimaFecha) {
                ultimaFecha = fecha;
            }

        }

    });

    mostrarEstadoUltimaActualizacion(ultimaFecha);

    actualizarProgresoPlan();

}

function actualizarProgresoPlan() {

    const checks =
        document.querySelectorAll(
            "input[data-tarea-id]"
        );

    const total =
        checks.length;

    const completadas =
        Array.from(checks)
        .filter(chk => chk.checked)
        .length;

    const porcentaje =
        total === 0
            ? 0
            : Math.round(
                (completadas / total) * 100
            );

    const pg =
        document.getElementById("pg");

    if (pg) {
        pg.innerText = porcentaje + "%";
    }

    const estado =
        document.getElementById("estado");

    if (estado) {

        if (porcentaje >= 75) {

            estado.innerText = "BUENO";
            estado.className = "estado bueno";

        } else if (porcentaje >= 50) {

            estado.innerText = "REGULAR";
            estado.className = "estado regular";

        } else {

            estado.innerText = "CRÍTICO";
            estado.className = "estado critico";

        }

    }

}

function mostrarEstadoUltimaActualizacion(fecha) {

    const contenedor =
        document.getElementById(
            "estadoInduccion"
        );

    if (!contenedor) return;

    if (!fecha) {

        contenedor.innerHTML =
            "Sin actualizaciones registradas";

        return;

    }

    const hoy =
        new Date();

    const diferenciaMs =
        hoy - fecha;

    const dias =
        Math.floor(
            diferenciaMs /
            (1000 * 60 * 60 * 24)
        );

    let estado = "Activo";

    if (dias >= 8) {
        estado = "Estancado";
    }

    contenedor.innerHTML = `
        <strong>
            Última actualización:
        </strong>
        hace ${dias} día(s)
        <br>
        <strong>
            Estado:
        </strong>
        ${estado}
    `;

}
